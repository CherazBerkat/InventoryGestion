import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, Play, Pause } from "lucide-react";
import { CountingSession, InventoryItem } from "@/types/inventory";

interface CountingSessionProps {
  currentSession: CountingSession;
  onSessionChange: (session: CountingSession) => void;
  items: InventoryItem[];
  filteredItems: InventoryItem[];
  isSession4: boolean;
}

export default function CountingSessionManager({
  currentSession,
  onSessionChange,
  items,
  filteredItems,
  isSession4,
}: CountingSessionProps) {
  // Get the items that should be counted for a specific session
  const getItemsForSession = (sessionNumber: 1 | 2 | 3 | 4) => {
    let itemsToCount = [...items];

    if (sessionNumber === 2) {
      // For session 2, only count items with variance1 !== 0
      itemsToCount = items.filter(
        (item) => item.counting1 === undefined || item.variance1 !== 0
      );
    } else if (sessionNumber === 3) {
      // For session 3, only count items with variance1 !== 0 AND variance2 !== 0
      itemsToCount = items.filter(
        (item) =>
          (item.counting1 === undefined || item.variance1 !== 0) &&
          (item.counting2 === undefined || item.variance2 !== 0)
      );
    } else if (sessionNumber === 4) {
      // For session 4, only count items with variance1 !== 0 AND variance2 !== 0 AND variance3 !== 0
      itemsToCount = items.filter(
        (item) =>
          (item.counting1 === undefined || item.variance1 !== 0) &&
          (item.counting2 === undefined || item.variance2 !== 0) &&
          (item.counting3 === undefined || item.variance3 !== 0)
      );
    }
    console.log(sessionNumber);
    console.log(itemsToCount);
    return itemsToCount;
  };

  const getSessionProgress = (sessionNumber: 1 | 2 | 3 | 4) => {
    const itemsToCount = getItemsForSession(sessionNumber);
    if (!itemsToCount || itemsToCount.length === 0)
      return { completed: 0, total: 0 };

    const countingField = `counting${sessionNumber}` as keyof InventoryItem;
    const completed = itemsToCount.filter(
      (item) => item[countingField] !== undefined
    ).length;
    return { completed, total: itemsToCount.length };
  };

  const handleSessionSelect = (sessionNumber: 1 | 2 | 3 | 4) => {
    const newSession: CountingSession = {
      sessionNumber,
      isActive: true,
      completedItems: [],
    };
    onSessionChange(newSession);
  };

  const isSessionCompleted = (sessionNumber: 1 | 2 | 3 | 4) => {
    const progress = getSessionProgress(sessionNumber);
    return progress.completed === progress.total && progress.total > 0;
  };

  const canStartSession = (sessionNumber: 1 | 2 | 3 | 4) => {
    if (sessionNumber === 1) return true;
    if (sessionNumber === 2) return isSessionCompleted(1);
    if (sessionNumber === 3) return isSessionCompleted(2);
    if (sessionNumber === 4) return isSessionCompleted(3);
    return false;
  };
  const numberSessions = isSession4 ? [1, 2, 3, 4] : [1, 2, 3];
  return (
    <div className="space-y-4">
      <div
        className={`grid grid-cols-1 ${
          isSession4 ? "md:grid-cols-4" : "md:grid-cols-3"
        } gap-4`}
      >
        {numberSessions.map((sessionNum) => {
          const session = sessionNum as 1 | 2 | 3 | 4;
          const progress = getSessionProgress(session);
          const isActive = currentSession.sessionNumber === session;
          const isCompleted = isSessionCompleted(session);
          const canStart = canStartSession(session);
          const progressPercentage =
            progress.total > 0
              ? (progress.completed / progress.total) * 100
              : 0;

          return (
            <Card
              key={session}
              className={`cursor-pointer transition-all duration-200 ${
                isActive
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : canStart
                  ? "hover:bg-gray-50"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => canStart && handleSessionSelect(session)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : isActive ? (
                      <Play className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="font-semibold">Session {session}</span>
                  </div>

                  <Badge
                    variant={
                      isCompleted
                        ? "default"
                        : isActive
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {isCompleted
                      ? "Terminé"
                      : isActive
                      ? "En cours"
                      : canStart
                      ? "Disponible"
                      : "Verrouillé"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>
                      {progress.completed}/{progress.total}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500"
                          : isActive
                          ? "bg-blue-500"
                          : "bg-gray-400"
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <div className="text-xs text-gray-500">
                    {Math.round(progressPercentage)}% complété
                  </div>
                </div>

                {!canStart && session > 1 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Terminez la session {session - 1} d'abord
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Session Info */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-blue-600" />
            <span className="font-medium">
              Session Active: {currentSession.sessionNumber}
            </span>
          </div>
          <Badge variant="secondary">
            {getSessionProgress(currentSession.sessionNumber).completed}/
            {getSessionProgress(currentSession.sessionNumber).total} articles
          </Badge>
        </div>

        <div className="text-sm text-gray-600">
          {isSessionCompleted(currentSession.sessionNumber)
            ? "Session terminée ✓"
            : "En cours de comptage..."}
        </div>
      </div>
    </div>
  );
}
