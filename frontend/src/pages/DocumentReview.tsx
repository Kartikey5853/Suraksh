import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Brain, CheckCircle, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserLayout from "@/components/UserLayout";

const DocumentReview = () => {
  const [showSignModal, setShowSignModal] = useState(false);

  return (
    <UserLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Document Review</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Document viewer */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">Employment Agreement</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-8 min-h-[400px] text-sm text-muted-foreground leading-relaxed">
              <p className="mb-4 font-medium text-foreground">EMPLOYMENT AGREEMENT</p>
              <p className="mb-3">This Employment Agreement ("Agreement") is entered into as of March 1, 2026, by and between Suraksh Technologies ("Company") and the undersigned employee ("Employee").</p>
              <p className="mb-3">1. POSITION AND DUTIES: Employee shall serve as Software Engineer and shall perform duties as assigned by the Company.</p>
              <p className="mb-3">2. COMPENSATION: Employee shall receive an annual salary of $[SALARY] payable in accordance with the Company's standard payroll practices.</p>
              <p className="mb-3">3. TERM: This Agreement shall commence on the date first written above and shall continue until terminated.</p>
              <p>4. CONFIDENTIALITY: Employee agrees to maintain the confidentiality of all proprietary information...</p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowSignModal(true)} className="gap-2">
                <CheckCircle className="w-4 h-4" /> Sign Document
              </Button>
              <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
                <X className="w-4 h-4" /> Reject
              </Button>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="w-4 h-4" /> Request Changes
              </Button>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-accent" />
              <h3 className="font-display font-semibold text-foreground">AI Analysis</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-foreground mb-1">Risk Level</p>
                <p className="text-accent font-semibold">Low Risk</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-foreground mb-1">Key Terms</p>
                <p className="text-muted-foreground">Standard employment terms, at-will employment, standard non-compete clause</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-foreground mb-1">Suggestions</p>
                <p className="text-muted-foreground">Review compensation section for placeholder values before signing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Modal */}
        {showSignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
            <motion.div
              className="bg-card rounded-2xl border border-border p-8 w-full max-w-md shadow-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Sign Document</h3>
              <p className="text-sm text-muted-foreground mb-6">Apply your digital signature to this agreement</p>
              <div className="border-2 border-dashed border-border rounded-xl h-32 flex items-center justify-center mb-6 bg-muted/30">
                <p className="text-sm text-muted-foreground italic">Your saved signature will appear here</p>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => setShowSignModal(false)}>Confirm Signature</Button>
                <Button variant="outline" onClick={() => setShowSignModal(false)}>Cancel</Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </UserLayout>
  );
};

export default DocumentReview;
