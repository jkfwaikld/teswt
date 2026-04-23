
"use client"

import { useState, useEffect } from 'react';
import { Driver, AttendanceStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Truck, 
  LayoutDashboard, 
  Users,
  AlertCircle,
  Filter,
  PieChart as PieChartIcon,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DriverCard } from '@/components/driver-card';
import { ResetTimer } from '@/components/reset-timer';
import { HistoryDialog } from '@/components/history-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser,
  useAuth,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";

export default function DriveSyncApp() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: '', mobile: '' });

  // 1. Auth Setup - Automatically sign in anonymously
  useEffect(() => {
    if (!user && !isUserLoading) {
      signInAnonymously(auth);
    }
  }, [user, isUserLoading, auth]);

  // 2. Fetch Drivers - Available to all authenticated users
  const driversQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'drivers');
  }, [firestore, user]);
  
  const { data: driversData, isLoading: isDriversLoading } = useCollection<Driver>(driversQuery);
  const drivers = driversData || [];

  const handleSetStatus = (driverId: string, status: AttendanceStatus) => {
    const now = new Date();
    const istOffset = 5.5 * 3600000;
    const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
    const dateStr = istTime.toISOString().split('T')[0];

    const driverRef = doc(firestore, 'drivers', driverId);
    
    updateDocumentNonBlocking(driverRef, {
      status: status,
      lastMarkedDate: dateStr,
      updatedAt: serverTimestamp()
    });

    const recordId = `${dateStr}`;
    const recordRef = doc(firestore, 'drivers', driverId, 'attendanceRecords', recordId);
    setDocumentNonBlocking(recordRef, {
      id: recordId,
      driverId: driverId,
      date: dateStr,
      status: status,
      markedAt: serverTimestamp()
    }, { merge: true });

    toast({ title: "Status Updated", description: `Attendance marked as ${status}.` });
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) return;

    const id = crypto.randomUUID();
    const driverRef = doc(firestore, 'drivers', id);
    
    setDocumentNonBlocking(driverRef, {
      id,
      name: formData.name,
      mobile: formData.mobile,
      status: 'absent',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: false });

    setIsAddOpen(false);
    setFormData({ name: '', mobile: '' });
    toast({ title: "Driver Added", description: `${formData.name} has been registered.` });
  };

  const handleEditDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    const driverRef = doc(firestore, 'drivers', selectedDriver.id);
    updateDocumentNonBlocking(driverRef, {
      name: formData.name,
      mobile: formData.mobile,
      updatedAt: serverTimestamp()
    });

    setIsEditOpen(false);
    setSelectedDriver(null);
    setFormData({ name: '', mobile: '' });
    toast({ title: "Profile Updated", description: "Driver details saved successfully." });
  };

  const confirmDeleteDriver = () => {
    if (!selectedDriver) return;
    const driverRef = doc(firestore, 'drivers', selectedDriver.id);
    deleteDocumentNonBlocking(driverRef);
    setIsDeleteAlertOpen(false);
    setSelectedDriver(null);
    toast({ title: "Driver Removed", description: "Staff member has been deleted." });
  };

  const openEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({ name: driver.name, mobile: driver.mobile });
    setIsEditOpen(true);
  };

  const openDelete = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteAlertOpen(true);
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.mobile?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Chart Data
  const chartData = [
    { name: "Present", value: drivers.filter(d => d.status === 'present').length, fill: "hsl(var(--accent))" },
    { name: "Absent", value: drivers.filter(d => d.status === 'absent').length, fill: "hsl(var(--destructive))" },
    { name: "Leave", value: drivers.filter(d => d.status === 'leave').length, fill: "hsl(var(--primary))" },
  ];

  const chartConfig = {
    Present: { label: "Present", color: "hsl(var(--accent))" },
    Absent: { label: "Absent", color: "hsl(var(--destructive))" },
    Leave: { label: "Leave", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-primary/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-primary">DriveSync Roster</h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Transport Fleet Management</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="hidden md:flex bg-accent hover:bg-accent/90 text-white font-semibold shadow-md shadow-accent/20 rounded-full px-6"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Staff
          </Button>
          <Button size="icon" onClick={() => setIsAddOpen(true)} className="md:hidden bg-accent hover:bg-accent/90 rounded-full">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/5 shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Staff</p>
                    <p className="text-2xl font-bold">
                      {isDriversLoading ? <Loader2 className="w-6 h-6 animate-spin inline" /> : drivers.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-accent/10 shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">On Duty Now</p>
                    <p className="text-2xl font-bold">
                      {isDriversLoading ? <Loader2 className="w-6 h-6 animate-spin inline" /> : drivers.filter(d => d.status === 'present').length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <ResetTimer />
            </div>

            <Card className="border-primary/5 shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Status Share</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[100px] flex items-center justify-center">
                {isDriversLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full">
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={25}
                        strokeWidth={2}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search staff by name or mobile..." 
                className="pl-12 h-14 bg-white border-primary/10 rounded-2xl text-lg shadow-sm focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
                <Filter className="w-4 h-4" /> Filter:
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
                <TabsList className="bg-white border border-primary/10 rounded-full h-11 p-1">
                  <TabsTrigger value="all" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-white">All</TabsTrigger>
                  <TabsTrigger value="present" className="rounded-full px-4 data-[state=active]:bg-accent data-[state=active]:text-white">Present</TabsTrigger>
                  <TabsTrigger value="absent" className="rounded-full px-4 data-[state=active]:bg-destructive data-[state=active]:text-white">Absent</TabsTrigger>
                  <TabsTrigger value="leave" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-white">Leave</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isDriversLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-primary" />
               <p className="text-muted-foreground font-medium animate-pulse">Fetching fleet data...</p>
             </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-primary/10">
              <AlertCircle className="w-12 h-12 opacity-20 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-primary">No Matching Results</h2>
              <p className="text-muted-foreground mt-1">Try a different name, number, or status filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDrivers.map(driver => (
                <DriverCard 
                  key={driver.id} 
                  driver={driver}
                  onSetStatus={handleSetStatus}
                  onEdit={openEdit}
                  onDelete={() => openDelete(driver)}
                  onShowHistory={(d) => {
                    setSelectedDriver(d);
                    setIsHistoryOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Dialogs */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-2xl">Register Staff</DialogTitle></DialogHeader>
          <form onSubmit={handleAddDriver} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" placeholder="+91 9876543210" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12">Register Now</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-2xl">Edit Profile</DialogTitle></DialogHeader>
          <form onSubmit={handleEditDriver} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mobile">Mobile Number</Label>
                <Input id="edit-mobile" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} required />
              </div>
            </div>
            <DialogFooter><Button type="submit" className="w-full h-12 font-bold">Update Profile</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <HistoryDialog driver={selectedDriver} isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Record?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove {selectedDriver?.name}'s data. This action is irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Record</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDriver} className="bg-destructive text-white hover:bg-destructive/90">Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
