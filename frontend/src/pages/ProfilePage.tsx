import { useState } from "react";
import { motion } from "framer-motion";
import { UserCircle, ShieldCheck, Mail, Phone, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserLayout from "@/components/UserLayout";

const ProfilePage = () => {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");

  return (
    <UserLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Profile</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <Button>Update Profile</Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Signature</h3>
              <div className="border-2 border-dashed border-border rounded-xl h-32 flex items-center justify-center mb-4 bg-muted/30">
                <p className="text-sm text-muted-foreground italic">Your digital signature</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Pen className="w-4 h-4" /> Update Signature
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <UserCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h3 className="font-display font-semibold text-foreground">Verification</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">Identity Verified</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </UserLayout>
  );
};

export default ProfilePage;
