
"use client"

import { Driver, AttendanceStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  Pencil,
  Trash2,
  UserCircle,
  Plane,
  Clock,
  MessageCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DriverCardProps {
  driver: Driver;
  onSetStatus: (id: string, status: AttendanceStatus) => void;
  onEdit: (driver: Driver) => void;
  onDelete: () => void;
  onShowHistory: (driver: Driver) => void;
}

export function DriverCard({ driver, onSetStatus, onEdit, onDelete, onShowHistory }: DriverCardProps) {
  const currentStatus = driver.status;
  
  // Format the last updated time if it exists
  const lastUpdated = driver.updatedAt ? (driver.updatedAt as any).toDate ? (driver.updatedAt as any).toDate() : new Date(driver.updatedAt) : null;
  const lastUpdatedStr = lastUpdated ? format(lastUpdated, 'h:mm a') : null;

  // Determine card styles based on status as requested
  // Red if absent, Green if present, Orange if leave
  const statusStyles = {
    present: "border-green-500/30 bg-green-50/80 shadow-green-100/20",
    absent: "border-red-500/30 bg-red-50/80 shadow-red-100/20",
    leave: "border-orange-500/30 bg-orange-50/80 shadow-orange-100/20",
    none: "border-primary/5 bg-white"
  };

  const currentStyles = currentStatus ? statusStyles[currentStatus] : statusStyles.none;

  return (
    <Card className={cn(
      "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-md",
      currentStyles
    )}>
      <CardContent className="p-5 flex flex-col gap-4">
        {/* Top: Header Info */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group/info flex-1"
            onClick={(e) => {
              e.preventDefault();
              onShowHistory(driver);
            }}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm",
              currentStatus === 'present' ? "bg-green-600 text-white" :
              currentStatus === 'leave' ? "bg-orange-500 text-white" :
              currentStatus === 'absent' ? "bg-red-600 text-white" :
              "bg-muted text-muted-foreground"
            )}>
              <div className="font-bold text-lg">{driver.name.charAt(0)}</div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-none group-hover/info:text-primary transition-colors">{driver.name}</h3>
                {lastUpdatedStr && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 border border-primary/5">
                    <Clock className="w-2 h-2" /> {lastUpdatedStr}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-medium tracking-tight">
                {driver.mobile}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              className="text-primary hover:text-primary hover:bg-primary/10 rounded-full h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <a href={`tel:${driver.mobile}`} title={`Call ${driver.name}`}>
                <Phone className="w-4 h-4" />
              </a>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <a 
                href={`https://wa.me/${driver.mobile.replace(/\s+/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                title={`WhatsApp ${driver.name}`}
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-8 w-8 focus:ring-0 focus:ring-offset-0" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuItem onSelect={() => onShowHistory(driver)}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Staff Profile & History
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onEdit(driver)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Driver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bottom: Explicit Status Buttons */}
        <div className="grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant={currentStatus === 'present' ? 'default' : 'outline'}
            className={cn(
              "h-10 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all",
              currentStatus === 'present' 
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm border-green-600" 
                : "border-primary/10 bg-white/50 hover:border-green-600 hover:text-green-600"
            )}
            onClick={() => onSetStatus(driver.id, 'present')}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Present
          </Button>

          <Button
            variant={currentStatus === 'absent' ? 'default' : 'outline'}
            className={cn(
              "h-10 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all",
              currentStatus === 'absent' 
                ? "bg-red-600 hover:bg-red-700 text-white shadow-sm border-red-600" 
                : "border-primary/10 bg-white/50 hover:border-red-600 hover:text-red-600"
            )}
            onClick={() => onSetStatus(driver.id, 'absent')}
          >
            <XCircle className="w-3 h-3 mr-1" />
            Absent
          </Button>

          <Button
            variant={currentStatus === 'leave' ? 'default' : 'outline'}
            className={cn(
              "h-10 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all",
              currentStatus === 'leave' 
                ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm border-orange-500" 
                : "border-primary/10 bg-white/50 hover:border-orange-500 hover:text-orange-500"
            )}
            onClick={() => onSetStatus(driver.id, 'leave')}
          >
            <Plane className="w-3 h-3 mr-1" />
            Leave
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
