import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import {
  Plus,
  FileJson,
  FileText,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Download,
} from "lucide-react";
import type { Evaluation } from "@shared/schema";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatLabel(format: string | null): string {
  if (!format) return "";
  const map: Record<string, string> = { solo: "Соло", duo: "Дуэт", group: "Группа" };
  return map[format] || format;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function History() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: evaluations, isLoading } = useQuery<Evaluation[]>({
    queryKey: ["/api/evaluations"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/evaluations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      toast({ title: "Удалено" });
    },
  });

  const handleExportJson = async (evaluation: Evaluation) => {
    const json = JSON.stringify(evaluation, null, 2);
    downloadBlob(json, `eval-${evaluation.eventDate || evaluation.id}.json`, "application/json");
  };

  const handleExportMarkdown = async (id: string) => {
    try {
      const res = await apiRequest("GET", `/api/evaluations/${id}/export/markdown`);
      const text = await res.text();
      downloadBlob(text, `eval-${id}.md`, "text/markdown");
    } catch (e) {
      toast({ title: "Ошибка экспорта", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">История оценок</h1>
          <Button
            size="sm"
            data-testid="button-new-eval"
            onClick={() => navigate("/")}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Новая
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : !evaluations || evaluations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">Пока пусто</h3>
              <p className="text-xs text-muted-foreground mb-4">Заполни свою первую оценку после перформанса</p>
              <Button size="sm" data-testid="button-create-first" onClick={() => navigate("/")}>
                <Plus className="h-4 w-4 mr-1.5" /> Создать
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.map((ev) => (
                <Card key={ev.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {ev.venue || "Без названия"}
                          </h3>
                          {ev.format && (
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {formatLabel(ev.format)}
                            </Badge>
                          )}
                          {ev.safetyRating && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ${
                                (ev.safetyRating as number) >= 4
                                  ? "border-emerald-200 text-emerald-600"
                                  : (ev.safetyRating as number) >= 3
                                    ? "border-blue-200 text-blue-600"
                                    : "border-orange-200 text-orange-600"
                              }`}
                            >
                              Безопасность: {ev.safetyRating}/5
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {ev.eventDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(ev.eventDate)}
                            </span>
                          )}
                          {ev.audienceCount && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {ev.audienceCount}
                            </span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-export-json-${ev.id}`}
                        onClick={() => handleExportJson(ev)}
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <FileJson className="h-3 w-3" /> JSON
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-export-md-${ev.id}`}
                        onClick={() => handleExportMarkdown(ev.id)}
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <FileText className="h-3 w-3" /> Markdown
                      </Button>
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-delete-${ev.id}`}
                        onClick={() => {
                          if (confirm("Удалить эту оценку?")) {
                            deleteMutation.mutate(ev.id);
                          }
                        }}
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
