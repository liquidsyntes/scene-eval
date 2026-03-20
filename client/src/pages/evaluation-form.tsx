import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import {
  Shield,
  Drama,
  User,
  Paintbrush,
  MessageSquare,
  Target,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  FileText,
  Save,
  Check,
} from "lucide-react";

// Block definitions
const BLOCKS = [
  { id: 0, title: "Общие", fullTitle: "Общие данные", icon: ClipboardList, color: "bg-blue-500/10 text-blue-600" },
  { id: 1, title: "Безопасн.", fullTitle: "Безопасность и согласие", icon: Shield, color: "bg-red-500/10 text-red-600" },
  { id: 2, title: "Драматург.", fullTitle: "Драматургия и структура", icon: Drama, color: "bg-purple-500/10 text-purple-600" },
  { id: 3, title: "Исполн.", fullTitle: "Сценическое исполнение", icon: User, color: "bg-amber-500/10 text-amber-600" },
  { id: 4, title: "Визуал", fullTitle: "Визуал, реквизит, техника", icon: Paintbrush, color: "bg-teal-500/10 text-teal-600" },
  { id: 5, title: "Реакция", fullTitle: "Реакция зала", icon: MessageSquare, color: "bg-pink-500/10 text-pink-600" },
  { id: 6, title: "Выводы", fullTitle: "Выводы и план", icon: Target, color: "bg-emerald-500/10 text-emerald-600" },
];

// Fields per block for progress calculation
const BLOCK_FIELDS: string[][] = [
  ["actName", "eventDate", "venue", "eventName", "format", "plannedDuration", "actualDuration", "audienceCount", "description"],
  ["preAgreements", "missedDiscussions", "partnerDifficulties", "limitViolations", "aftercare", "partnerWords", "safetyRating", "safetyRatingReason"],
  ["structure", "tempoIssues", "organicTransitions", "roughTransitions", "actualStory", "bestDramaturgy", "worstDramaturgy", "storyRating", "storyRatingReason"],
  ["bodyPresence", "parasiticMovements", "spaceUsage", "ignoredAreas", "partnerSync", "partnerLoss", "partnerContactRating", "partnerContactRatingReason", "audienceContact", "audienceLoss", "audienceContactRating", "audienceContactRatingReason", "voiceWorked", "voiceFailed"],
  ["costumeReadability", "costumeIssues", "costumeBudget", "propsWorked", "propsIssues", "musicUsed", "lightMusicGood", "lightMusicBad", "techFails", "techFailHandling"],
  ["audienceEngaged", "audienceDiscomfort", "feedbackQuotes", "feedbackThemes", "partnerBest", "partnerImprove"],
  ["strong1", "strong2", "strong3", "weak1", "weak2", "weak3", "removeCompletely", "changeRadically", "addNew", "mainFocus"],
];

type FormData = Record<string, any>;

function TextArea({ label, hint, field, value, onChange }: { label: string; hint?: string; field: string; value: string; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={field} className="text-sm font-medium text-foreground">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Textarea
        id={field}
        data-testid={`input-${field}`}
        value={value || ""}
        onChange={(e) => onChange(field, e.target.value)}
        className="min-h-[80px] resize-y bg-background border-border/60 focus:border-primary/40 transition-colors text-sm"
        placeholder="..."
      />
    </div>
  );
}

function TextInput({ label, field, value, onChange, placeholder, type = "text" }: { label: string; field: string; value: string; onChange: (field: string, value: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={field} className="text-sm font-medium text-foreground">{label}</Label>
      <Input
        id={field}
        data-testid={`input-${field}`}
        type={type}
        value={value || ""}
        onChange={(e) => onChange(field, e.target.value)}
        className="bg-background border-border/60 focus:border-primary/40 transition-colors text-sm"
        placeholder={placeholder || "..."}
      />
    </div>
  );
}

function SafetySlider({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const labels = ["", "Небезопасно", "Были риски", "Нормально", "Хорошо", "Отлично"];
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">Оценка безопасности</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${colors[value]} bg-opacity-10 text-xs`}>
            {value}/5
          </Badge>
          <span className="text-xs text-muted-foreground">{labels[value]}</span>
        </div>
      </div>
      <div className="px-1">
        <Slider
          data-testid="slider-safety"
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="text-[10px] text-muted-foreground">{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RatingSlider({ label, value, onChange, testId }: { label: string; value: number; onChange: (val: number) => void; testId?: string }) {
  const labels = ["", "Плохо", "Слабо", "Нормально", "Хорошо", "Отлично"];
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${colors[value]} bg-opacity-10 text-xs`}>
            {value}/5
          </Badge>
          <span className="text-xs text-muted-foreground">{labels[value]}</span>
        </div>
      </div>
      <div className="px-1">
        <Slider
          data-testid={testId}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="text-[10px] text-muted-foreground">{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Block content components
function Block0({ data, onChange }: { data: FormData; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-4">
      <TextInput label="Название номера" field="actName" value={data.actName} onChange={onChange} placeholder="напр. Метаморфозы" />
      <TextInput label="Дата" field="eventDate" value={data.eventDate} onChange={onChange} type="date" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput label="Площадка" field="venue" value={data.venue} onChange={onChange} placeholder="напр. Клуб X" />
        <TextInput label="Событие" field="eventName" value={data.eventName} onChange={onChange} placeholder="напр. Вечер импровизаций" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="format" className="text-sm font-medium text-foreground">Формат</Label>
        <Select value={data.format || ""} onValueChange={(v) => onChange("format", v)}>
          <SelectTrigger data-testid="select-format" className="bg-background border-border/60">
            <SelectValue placeholder="Выбрать формат..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solo">Соло</SelectItem>
            <SelectItem value="duo">Дуэт</SelectItem>
            <SelectItem value="group">Группа</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput label="Плановая длительность" field="plannedDuration" value={data.plannedDuration} onChange={onChange} placeholder="напр. 20 мин" />
        <TextInput label="Фактическая длительность" field="actualDuration" value={data.actualDuration} onChange={onChange} placeholder="напр. 25 мин" />
      </div>
      <TextInput label="Количество зрителей (примерно)" field="audienceCount" value={data.audienceCount} onChange={onChange} placeholder="напр. ~30" />
      <TextArea label="Краткое описание номера" hint="1–3 предложения, без оценок, чистый факт" field="description" value={data.description} onChange={onChange} />
    </div>
  );
}

function Block1({ data, onChange }: { data: FormData; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1 mb-2">
        <h4 className="text-sm font-semibold text-foreground">1. Пред-сценовые договорённости</h4>
      </div>
      <TextArea label="Что было оговорено заранее" hint="Лимиты, стоп-слова, мед. моменты, триггеры" field="preAgreements" value={data.preAgreements} onChange={onChange} />
      <TextArea label="Что надо было обсудить, но не обсудили" field="missedDiscussions" value={data.missedDiscussions} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">2. Во время сцены</h4>
      </div>
      <TextArea label="Моменты трудности у партнёра" hint="Физические или эмоциональные — эпизоды, признаки, твои действия" field="partnerDifficulties" value={data.partnerDifficulties} onChange={onChange} />
      <TextArea label="Нарушения договоренностей/лимитов" hint="Какие, почему так вышло" field="limitViolations" value={data.limitViolations} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">3. После сцены</h4>
      </div>
      <TextArea label="Как прошёл aftercare" hint="Что делали, сколько времени, какие темы обсудили" field="aftercare" value={data.aftercare} onChange={onChange} />
      <TextArea label="Основные слова/мысли партнёра" hint="Цитата или пересказ" field="partnerWords" value={data.partnerWords} onChange={onChange} />
      <div className="pt-2 border-t border-border/40">
        <SafetySlider value={data.safetyRating || 3} onChange={(v) => onChange("safetyRating", String(v))} />
      </div>
      <TextArea label="Обоснование оценки" field="safetyRatingReason" value={data.safetyRatingReason} onChange={onChange} />
    </div>
  );
}

function Block2({ data, onChange }: { data: FormData; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1 mb-2">
        <h4 className="text-sm font-semibold text-foreground">1. Структура номера</h4>
      </div>
      <TextArea label="Как выглядела структура по факту" hint="Завязка → развитие → кульминация → завершение" field="structure" value={data.structure} onChange={onChange} />
      <TextArea label="Провисы темпа или суета" hint="Укажи моменты и что там происходило" field="tempoIssues" value={data.tempoIssues} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">2. Логика переходов</h4>
      </div>
      <TextArea label="Органичные переходы" hint="Вербальное/физическое, мягкое/жёсткое" field="organicTransitions" value={data.organicTransitions} onChange={onChange} />
      <TextArea label="Рваные / непонятные переходы" hint="Что не сработало" field="roughTransitions" value={data.roughTransitions} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">3. Внутренняя «история»</h4>
      </div>
      <TextArea label="О чём была эта сцена по факту" hint="Не замысел, а то, что реально получилось" field="actualStory" value={data.actualStory} onChange={onChange} />
      <TextArea label="Где драматургия удалась" field="bestDramaturgy" value={data.bestDramaturgy} onChange={onChange} />
      <TextArea label="Где драматургия провалилась" field="worstDramaturgy" value={data.worstDramaturgy} onChange={onChange} />
      <div className="pt-2 border-t border-border/40">
        <RatingSlider label="Общая оценка внутренней истории" value={data.storyRating || 3} onChange={(v) => onChange("storyRating", String(v))} testId="slider-story" />
      </div>
      <TextArea label="Обоснование оценки" field="storyRatingReason" value={data.storyRatingReason} onChange={onChange} />
    </div>
  );
}

function Block3({ data, onChange }: { data: FormData; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1 mb-2">
        <h4 className="text-sm font-semibold text-foreground">1. Тело и присутствие</h4>
      </div>
      <TextArea label="Пластика и уверенность" hint="Позы, движения, жесты, моменты зажатости" field="bodyPresence" value={data.bodyPresence} onChange={onChange} />
      <TextArea label="Паразитные движения" hint="Повторяющиеся движения или позиции — какие, когда" field="parasiticMovements" value={data.parasiticMovements} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">2. Работа с пространством</h4>
      </div>
      <TextArea label="Как использовал сцену" hint="Дистанции, уровни, приближение/отдаление от зрителя" field="spaceUsage" value={data.spaceUsage} onChange={onChange} />
      <TextArea label="Неиспользованные участки" field="ignoredAreas" value={data.ignoredAreas} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">3. Контакт с партнёром</h4>
      </div>
      <TextArea label="Синхронность и считывание" field="partnerSync" value={data.partnerSync} onChange={onChange} />
      <TextArea label="Потеря связи" hint="Что пошло не так, как отреагировал" field="partnerLoss" value={data.partnerLoss} onChange={onChange} />
      <div className="pt-2 border-t border-border/40">
        <RatingSlider label="Общая оценка контакта с партнёром" value={data.partnerContactRating || 3} onChange={(v) => onChange("partnerContactRating", String(v))} testId="slider-partner-contact" />
      </div>
      <TextArea label="Обоснование оценки" field="partnerContactRatingReason" value={data.partnerContactRatingReason} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">4. Контакт с залом</h4>
      </div>
      <TextArea label="Чувствовал зал" hint="Взгляд, тишина, реакция — как это влияло на игру" field="audienceContact" value={data.audienceContact} onChange={onChange} />
      <TextArea label="Потерял зал" hint="Что происходило на сцене в эти моменты" field="audienceLoss" value={data.audienceLoss} onChange={onChange} />
      <div className="pt-2 border-t border-border/40">
        <RatingSlider label="Общая оценка контакта с залом" value={data.audienceContactRating || 3} onChange={(v) => onChange("audienceContactRating", String(v))} testId="slider-audience-contact" />
      </div>
      <TextArea label="Обоснование оценки" field="audienceContactRatingReason" value={data.audienceContactRatingReason} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">5. Голос и звук</h4>
      </div>
      <TextArea label="Что сработало" hint="Интонации, паузы, громкость, акценты" field="voiceWorked" value={data.voiceWorked} onChange={onChange} />
      <TextArea label="Что не сработало" field="voiceFailed" value={data.voiceFailed} onChange={onChange} />
    </div>
  );
}

function Block4({ data, onChange }: { data: FormData; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1 mb-2">
        <h4 className="text-sm font-semibold text-foreground">1. Образ и костюм</h4>
      </div>
      <TextArea label="Считываемость роли и настроения" field="costumeReadability" value={data.costumeReadability} onChange={onChange} />
      <TextArea label="Что было неудобно или мешало" field="costumeIssues" value={data.costumeIssues} onChange={onChange} />
      <TextInput label="Бюджет на костюм(ы)" field="costumeBudget" value={data.costumeBudget} onChange={onChange} placeholder="напр. 5000 грн / 150 EUR" />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">2. Реквизит</h4>
      </div>
      <TextArea label="Что сработало идеально" hint="Надёжность, доступность, внешний вид" field="propsWorked" value={data.propsWorked} onChange={onChange} />
      <TextArea label="Проблемы с реквизитом" hint="Запуталось, упало, не сработало, заняло больше времени" field="propsIssues" value={data.propsIssues} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">3. Свет и музыка</h4>
      </div>
      <TextArea label="Используемая музыка" hint="Названия треков, исполнители" field="musicUsed" value={data.musicUsed} onChange={onChange} />
      <TextArea label="Где усиливали сцену" field="lightMusicGood" value={data.lightMusicGood} onChange={onChange} />
      <TextArea label="Где мешали или не хватало" field="lightMusicBad" value={data.lightMusicBad} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">4. Технические сбои</h4>
      </div>
      <TextArea label="Какие конкретно были" hint="Звук, свет, крепления, верёвки и т.п." field="techFails" value={data.techFails} onChange={onChange} />
      <TextArea label="Как разрулил в моменте" hint="Насколько органично для зрителя" field="techFailHandling" value={data.techFailHandling} onChange={onChange} />
    </div>
  );
}

function Block5({ data, onChange }: { data: FormData; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1 mb-2">
        <h4 className="text-sm font-semibold text-foreground">1. Реакция во время номера</h4>
      </div>
      <TextArea label="Где зал «залип»" hint="Моменты, жесты, элементы сцены" field="audienceEngaged" value={data.audienceEngaged} onChange={onChange} />
      <TextArea label="Дискомфорт / выпадение зала" hint="Отводят взгляд, нервный смех и т.п." field="audienceDiscomfort" value={data.audienceDiscomfort} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">2. Слова людей после</h4>
      </div>
      <TextArea label="Цитаты" hint="1–3 цитаты дословно" field="feedbackQuotes" value={data.feedbackQuotes} onChange={onChange} />
      <TextArea label="Повторяющиеся темы в отзывах" hint="Например: «атмосфера», «жёстко», «слишком долго»" field="feedbackThemes" value={data.feedbackThemes} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">3. Обратная связь от партнёра</h4>
      </div>
      <TextArea label="Лучшее в перформансе" field="partnerBest" value={data.partnerBest} onChange={onChange} />
      <TextArea label="Что улучшить или изменить" field="partnerImprove" value={data.partnerImprove} onChange={onChange} />
    </div>
  );
}

function Block6({ data, onChange }: { data: FormData; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1 mb-2">
        <h4 className="text-sm font-semibold text-foreground">Три сильных момента</h4>
      </div>
      <TextArea label="Сильный момент №1" hint="Конкретный эпизод + почему он был сильным" field="strong1" value={data.strong1} onChange={onChange} />
      <TextArea label="Сильный момент №2" field="strong2" value={data.strong2} onChange={onChange} />
      <TextArea label="Сильный момент №3" field="strong3" value={data.strong3} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">Три слабых момента</h4>
      </div>
      <TextArea label="Слабый момент №1" hint="Что именно произошло и почему это проблема" field="weak1" value={data.weak1} onChange={onChange} />
      <TextArea label="Слабый момент №2" field="weak2" value={data.weak2} onChange={onChange} />
      <TextArea label="Слабый момент №3" field="weak3" value={data.weak3} onChange={onChange} />
      <div className="space-y-1 mb-2 pt-2 border-t border-border/40">
        <h4 className="text-sm font-semibold text-foreground">Изменения к следующему выступлению</h4>
      </div>
      <TextArea label="Что убираю полностью" field="removeCompletely" value={data.removeCompletely} onChange={onChange} />
      <TextArea label="Что радикально меняю (и как)" field="changeRadically" value={data.changeRadically} onChange={onChange} />
      <TextArea label="Что добавляю нового" field="addNew" value={data.addNew} onChange={onChange} />
      <div className="pt-2 border-t border-border/40">
        <TextArea label="Главный фокус на рост" hint="Одна вещь для прокачки — и как именно буду тренировать" field="mainFocus" value={data.mainFocus} onChange={onChange} />
      </div>
    </div>
  );
}

const BLOCK_COMPONENTS = [Block0, Block1, Block2, Block3, Block4, Block5, Block6];

export default function EvaluationForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentBlock, setCurrentBlock] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load draft on mount
  const { data: draft } = useQuery<FormData>({
    queryKey: ["/api/draft"],
  });

  useEffect(() => {
    if (draft && Object.keys(draft).length > 0 && Object.keys(formData).length === 0) {
      setFormData(draft);
    }
  }, [draft]);

  // Autosave draft
  const saveDraftMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/draft", data);
    },
    onSuccess: () => {
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    },
  });

  const triggerAutosave = useCallback((data: FormData) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveDraftMutation.mutate(data);
    }, 1500);
  }, []);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      triggerAutosave(next);
      return next;
    });
  }, [triggerAutosave]);

  // Save final evaluation
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/evaluations", data);
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/draft"] });
      toast({ title: "Сохранено", description: "Оценка успешно сохранена" });
      navigate(`/history`);
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  // Progress calculation
  const calculateBlockProgress = (blockIndex: number): number => {
    const fields = BLOCK_FIELDS[blockIndex];
    const filled = fields.filter((f) => {
      const val = formData[f];
      return val !== undefined && val !== null && val !== "";
    }).length;
    return Math.round((filled / fields.length) * 100);
  };

  const totalProgress = (() => {
    const allFields = BLOCK_FIELDS.flat();
    const filled = allFields.filter((f) => {
      const val = formData[f];
      return val !== undefined && val !== null && val !== "";
    }).length;
    return Math.round((filled / allFields.length) * 100);
  })();

  const BlockComponent = BLOCK_COMPONENTS[currentBlock];
  const block = BLOCKS[currentBlock];

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Scene Eval</h1>
            {draftSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 animate-in fade-in duration-300">
                <Check className="h-3 w-3" /> черновик
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-history"
              onClick={() => navigate("/history")}
              className="text-muted-foreground text-xs"
            >
              История
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-3">
            <Progress value={totalProgress} className="h-1.5 flex-1" data-testid="progress-total" />
            <span className="text-xs text-muted-foreground font-medium tabular-nums w-8 text-right">{totalProgress}%</span>
          </div>
        </div>
      </header>

      {/* Block navigation pills */}
      <div className="sticky top-[85px] z-20 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {BLOCKS.map((b, i) => {
              const progress = calculateBlockProgress(i);
              const Icon = b.icon;
              return (
                <button
                  key={b.id}
                  data-testid={`nav-block-${i}`}
                  onClick={() => { setCurrentBlock(i); scrollToTop(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                    ${currentBlock === i
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : progress === 100
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{b.title}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Block header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${block.color}`}>
              <block.icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Блок {currentBlock + 1}. {block.fullTitle}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${calculateBlockProgress(currentBlock)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{calculateBlockProgress(currentBlock)}%</span>
              </div>
            </div>
          </div>

          {/* Block form content */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <BlockComponent data={formData} onChange={handleFieldChange} />
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pb-8">
            <Button
              variant="outline"
              size="sm"
              data-testid="button-prev"
              disabled={currentBlock === 0}
              onClick={() => { setCurrentBlock((p) => p - 1); scrollToTop(); }}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Назад
            </Button>

            {currentBlock < BLOCKS.length - 1 ? (
              <Button
                size="sm"
                data-testid="button-next"
                onClick={() => { setCurrentBlock((p) => p + 1); scrollToTop(); }}
                className="gap-1.5"
              >
                Далее <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                data-testid="button-save"
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Сохраняю..." : "Сохранить"}
              </Button>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-3">
        <div className="max-w-3xl mx-auto px-4">
          <PerplexityAttribution />
        </div>
      </footer>
    </div>
  );
}
