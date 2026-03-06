import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Eye, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserLayout from "@/components/UserLayout";

const documents = [
  { name: "Employment Agreement", sender: "HR Department", status: "Signed", date: "2026-03-01" },
  { name: "NDA - Project Alpha", sender: "Legal Team", status: "Pending", date: "2026-03-04" },
  { name: "Service Contract", sender: "Procurement", status: "Signed", date: "2026-02-28" },
  { name: "Lease Agreement", sender: "Admin Office", status: "Rejected", date: "2026-02-20" },
  { name: "Insurance Policy", sender: "HR Department", status: "Pending", date: "2026-03-05" },
];

const statusColors: Record<string, string> = {
  Signed: "text-accent bg-accent/10",
  Pending: "text-primary bg-primary/10",
  Rejected: "text-destructive bg-destructive/10",
};

const DocumentHistory = () => {
  return (
    <UserLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-foreground">Document History</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search documents..." className="pl-10" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Document</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Sender</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{doc.name}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{doc.sender}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[doc.status]}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{doc.date}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </UserLayout>
  );
};

export default DocumentHistory;
