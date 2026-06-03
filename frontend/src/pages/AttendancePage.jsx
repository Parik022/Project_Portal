import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/attendance"), api.get("/attendance/stats")])
      .then(([attRes, statsRes]) => {
        setRecords(attRes.data);
        setStats(statsRes.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={
          user?.role === "FACULTY"
            ? "Attendance auto-marked when students submit weekly reports"
            : "Your attendance from weekly submissions"
        }
      />

      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Total records" value={stats.total} icon={CalendarCheck} />
          <StatCard title="Present" value={stats.present} icon={CalendarCheck} accent />
          <StatCard title="Rate" value={`${stats.percentage}%`} icon={CalendarCheck} />
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No attendance records"
          description="Attendance is recorded automatically when weekly reports are submitted."
        />
      ) : (
        <div className="space-y-2.5">
          {records.map((r) => (
            <ListRow key={r.id}>
              <div className="text-left">
                <p className="font-medium text-foreground">Week {r.weekNumber}</p>
                {user?.role === "FACULTY" && r.student && (
                  <p className="text-sm text-muted">{r.student.name}</p>
                )}
                {r.submission && (
                  <p className="mt-0.5 text-xs text-muted">{r.submission.title}</p>
                )}
              </div>
              <Badge variant={r.status === "PRESENT" ? "success" : "muted"}>{r.status}</Badge>
            </ListRow>
          ))}
        </div>
      )}
    </div>
  );
}
