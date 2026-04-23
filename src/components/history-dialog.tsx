
"use client"

import { useState } from 'react';
import { Driver } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, UserCircle, Loader2, Calendar, Phone } from 'lucide-react';
import { summarizeAttendancePattern } from '@/ai/flows/attendance-pattern-summary-flow';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

interface HistoryDialogProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryDialog({ driver, isOpen, onClose }: HistoryDialogProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const firestore = useFirestore();

  // Fetch history records from Firestore subcollection
  const historyQuery = useMemoFirebase(() => {
    if (!driver) return null;
    return query(
      collection(firestore, 'drivers', driver.id, 'attendanceRecords'),
      orderBy('date', 'desc')
    );
  }, [firestore, driver]);

  const { data: historyRecords, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const handleGenerateSummary = async () => {
    if (!driver || !historyRecords) return;
    setAiLoading(true);
    try {
      const result = await summarizeAttendancePattern({
        driverName: driver.name,
        attendanceRecords: historyRecords.map(r => ({ date: r.date, status: r.status })),
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("AI Summary Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  if (!driver) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-white shadow-sm">
                <span className="text-xl font-bold">{driver.name.charAt(0)}</span>
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-primary">{driver.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                   <DialogDescription className="flex items-center gap-1.5 font-medium">
                     <Phone className="w-3 h-3" /> {driver.mobile}
                   </DialogDescription>
                   <span className="text-muted-foreground/30">•</span>
                   <Badge variant="outline" className="h-5 text-[10px] px-2">
                     STAFF PROFILE
                   </Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 space-y-6">
          {/* AI Insights Section */}
          <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-white border border-primary/10 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                AI Attendance Insights
              </h4>
              {!summary && !aiLoading && (
                <Button 
                  size="sm" 
                  onClick={handleGenerateSummary}
                  disabled={!historyRecords || historyRecords.length === 0}
                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-white rounded-full px-4 shadow-sm shadow-primary/20"
                >
                  Analyze Patterns
                </Button>
              )}
            </div>
            
            {aiLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                <span className="ml-3 text-sm font-medium text-muted-foreground">Generating summary...</span>
              </div>
            ) : summary ? (
              <div className="text-sm leading-relaxed text-slate-700 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/40 animate-in fade-in slide-in-from-top-2 duration-500">
                {summary}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic pl-1">
                {historyRecords && historyRecords.length > 0 
                  ? "Analyze past records to see this driver's punctuality and consistency trends."
                  : "Insufficient data for AI pattern analysis."}
              </p>
            )}
          </div>

          {/* Records List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 px-1 text-slate-600">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Attendance History
            </h4>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-2.5">
                {isHistoryLoading ? (
                   <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary/30" /></div>
                ) : !historyRecords || historyRecords.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm text-muted-foreground">No records found for this driver.</p>
                  </div>
                ) : (
                  historyRecords.map((record, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-white hover:border-primary/20 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                           <span className="text-[10px] font-bold text-slate-400">{historyRecords.length - idx}</span>
                         </div>
                         <span className="text-sm font-semibold text-slate-700">
                          {new Date(record.date).toLocaleDateString('en-GB', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <Badge 
                        variant={record.status === 'present' ? 'default' : record.status === 'leave' ? 'secondary' : 'outline'}
                        className={cn(
                          "rounded-full px-3 py-0.5 text-[10px] font-bold tracking-tight shadow-sm",
                          record.status === 'present' ? "bg-accent hover:bg-accent border-accent" : 
                          record.status === 'leave' ? "bg-primary hover:bg-primary text-white border-primary" : 
                          "text-muted-foreground border-muted-foreground/30"
                        )}
                      >
                        {record.status?.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
