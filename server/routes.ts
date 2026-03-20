import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Get all evaluations
  app.get("/api/evaluations", async (_req, res) => {
    const evaluations = await storage.getAllEvaluations();
    res.json(evaluations);
  });

  // Get single evaluation
  app.get("/api/evaluations/:id", async (req, res) => {
    const evaluation = await storage.getEvaluation(req.params.id);
    if (!evaluation) return res.status(404).json({ error: "Not found" });
    res.json(evaluation);
  });

  // Create evaluation
  app.post("/api/evaluations", async (req, res) => {
    const evaluation = await storage.createEvaluation(req.body);
    res.status(201).json(evaluation);
  });

  // Update evaluation
  app.patch("/api/evaluations/:id", async (req, res) => {
    const evaluation = await storage.updateEvaluation(req.params.id, req.body);
    if (!evaluation) return res.status(404).json({ error: "Not found" });
    res.json(evaluation);
  });

  // Delete evaluation
  app.delete("/api/evaluations/:id", async (req, res) => {
    const success = await storage.deleteEvaluation(req.params.id);
    if (!success) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  });

  // Draft endpoints
  app.post("/api/draft", async (req, res) => {
    const result = await storage.saveDraft(req.body);
    res.json(result);
  });

  app.get("/api/draft", async (_req, res) => {
    const draft = await storage.getDraft();
    res.json(draft || {});
  });

  // Export as JSON
  app.get("/api/evaluations/:id/export/json", async (req, res) => {
    const evaluation = await storage.getEvaluation(req.params.id);
    if (!evaluation) return res.status(404).json({ error: "Not found" });
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="evaluation-${evaluation.eventDate || evaluation.id}.json"`);
    res.json(evaluation);
  });

  // Export as Markdown
  app.get("/api/evaluations/:id/export/markdown", async (req, res) => {
    const e = await storage.getEvaluation(req.params.id);
    if (!e) return res.status(404).json({ error: "Not found" });

    const md = generateMarkdown(e);
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="evaluation-${e.eventDate || e.id}.md"`);
    res.send(md);
  });

  return httpServer;
}

function generateMarkdown(e: any): string {
  return `## Блок 1. Общие данные

* Название номера: ${e.actName || ''}
* Дата: ${e.eventDate || ''}
* Площадка: ${e.venue || ''}
* Событие: ${e.eventName || ''}
* Формат: ${e.format || ''}
* Плановая длительность: ${e.plannedDuration || ''} / фактическая: ${e.actualDuration || ''}
* Количество зрителей: ${e.audienceCount || ''}
* Краткое описание: ${e.description || ''}

---

## Блок 2. Безопасность и согласие

1. Пред-сценовые договорённости: ${e.preAgreements || ''}
   * Что не обсудили: ${e.missedDiscussions || ''}
2. Во время сцены:
   * Трудности партнёра: ${e.partnerDifficulties || ''}
   * Нарушения лимитов: ${e.limitViolations || ''}
3. После сцены:
   * Aftercare: ${e.aftercare || ''}
   * Слова партнёра: ${e.partnerWords || ''}
4. Оценка безопасности: ${e.safetyRating || '—'}/5
   * Обоснование: ${e.safetyRatingReason || ''}

---

## Блок 3. Драматургия и структура

1. Структура: ${e.structure || ''}
   * Провисы/суета: ${e.tempoIssues || ''}
2. Переходы:
   * Органичные: ${e.organicTransitions || ''}
   * Рваные: ${e.roughTransitions || ''}
3. История:
   * О чём: ${e.actualStory || ''}
   * Удалось: ${e.bestDramaturgy || ''}
   * Провалилось: ${e.worstDramaturgy || ''}
   * Оценка внутренней истории: ${e.storyRating || '—'}/5
   * Обоснование: ${e.storyRatingReason || ''}

---

## Блок 4. Сценическое исполнение

1. Тело: ${e.bodyPresence || ''}
   * Паразитные движения: ${e.parasiticMovements || ''}
2. Пространство: ${e.spaceUsage || ''}
   * Неиспользованные зоны: ${e.ignoredAreas || ''}
3. Контакт с партнёром:
   * Синхронность: ${e.partnerSync || ''}
   * Потеря связи: ${e.partnerLoss || ''}
   * Оценка контакта с партнёром: ${e.partnerContactRating || '—'}/5
   * Обоснование: ${e.partnerContactRatingReason || ''}
4. Контакт с залом:
   * Чувствовал зал: ${e.audienceContact || ''}
   * Потерял зал: ${e.audienceLoss || ''}
   * Оценка контакта с залом: ${e.audienceContactRating || '—'}/5
   * Обоснование: ${e.audienceContactRatingReason || ''}
5. Голос:
   * Сработало: ${e.voiceWorked || ''}
   * Не сработало: ${e.voiceFailed || ''}

---

## Блок 5. Визуал, реквизит, техника

1. Костюм: ${e.costumeReadability || ''}
   * Проблемы: ${e.costumeIssues || ''}
   * Бюджет: ${e.costumeBudget || ''}
2. Реквизит:
   * Сработало: ${e.propsWorked || ''}
   * Проблемы: ${e.propsIssues || ''}
3. Свет и музыка:
   * Используемая музыка: ${e.musicUsed || ''}
   * Усилили: ${e.lightMusicGood || ''}
   * Мешали: ${e.lightMusicBad || ''}
4. Техсбои: ${e.techFails || ''}
   * Как разрулил: ${e.techFailHandling || ''}

---

## Блок 6. Реакция зала и обратная связь

1. Реакция зала:
   * Залипли: ${e.audienceEngaged || ''}
   * Дискомфорт: ${e.audienceDiscomfort || ''}
2. Цитаты: ${e.feedbackQuotes || ''}
   * Повторяющиеся темы: ${e.feedbackThemes || ''}
3. Обратная связь партнёра:
   * Лучшее: ${e.partnerBest || ''}
   * Улучшить: ${e.partnerImprove || ''}

---

## Блок 7. Выводы и план

**Сильные моменты:**
1. ${e.strong1 || ''}
2. ${e.strong2 || ''}
3. ${e.strong3 || ''}

**Слабые моменты:**
1. ${e.weak1 || ''}
2. ${e.weak2 || ''}
3. ${e.weak3 || ''}

**Изменения к следующему:**
* Убираю: ${e.removeCompletely || ''}
* Меняю: ${e.changeRadically || ''}
* Добавляю: ${e.addNew || ''}

**Главный фокус:** ${e.mainFocus || ''}
`;
}
