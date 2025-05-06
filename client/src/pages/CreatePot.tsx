import { useState } from "react";
import { useLocation } from "wouter";
import { usePot } from "@/context/PotContext";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/utils";
import { FaPlus, FaTimes } from "react-icons/fa";

type Member = {
  id: string;
  contact: string;
};

export default function CreatePot() {
  const { addPot } = usePot();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState<number>(500);
  const [payoutStructure, setPayoutStructure] = useState<"one-to-many" | "many-to-one" | "many-to-selected">("one-to-many");
  const [withdrawalMethod, setWithdrawalMethod] = useState<"democratic" | "admin" | "timed">("democratic");
  const [voteThreshold, setVoteThreshold] = useState<string>("75");
  const [releaseDate, setReleaseDate] = useState<string>("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  
  const handleAddMember = () => {
    if (!memberInput.trim()) return;
    
    const newMember = {
      id: generateId(),
      contact: memberInput.trim(),
    };
    
    setMembers([...members, newMember]);
    setMemberInput("");
  };
  
  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(member => member.id !== id));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: "Error",
        description: "Please enter a pot name",
        variant: "destructive",
      });
      return;
    }
    
    if (goalAmount <= 0) {
      toast({
        title: "Error",
        description: "Goal amount must be greater than zero",
        variant: "destructive",
      });
      return;
    }
    
    if (withdrawalMethod === "timed" && !releaseDate) {
      toast({
        title: "Error",
        description: "Please select a release date for the timed withdrawal",
        variant: "destructive",
      });
      return;
    }
    
    // Create a new pot
    const newPot = {
      id: generateId(),
      name,
      description,
      goalAmount,
      currentBalance: 0,
      payoutStructure,
      withdrawalMethod,
      voteThreshold: withdrawalMethod === "democratic" ? parseFloat(voteThreshold) : undefined,
      releaseDate: withdrawalMethod === "timed" ? releaseDate : undefined,
      creator: "Current User", // Simulated current user
      createdBy: "Current User",
      members: ["Current User", ...members.map(m => m.contact)],
      recipients: payoutStructure === "one-to-many" 
        ? members.map(m => m.contact)
        : payoutStructure === "many-to-one"
          ? ["Sarah"] // Default for demo
          : ["Selected Members"], // For many-to-selected
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    addPot(newPot);
    
    toast({
      title: "Success",
      description: "Pot created successfully!",
    });
    
    navigate("/");
  };
  
  return (
    <div className="slide-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Create a New Pot</h1>
        <p className="text-secondary-foreground">Set up your group savings with customized rules</p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Pot Information */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-secondary-foreground text-sm mb-2">Pot Name</Label>
                    <Input 
                      type="text" 
                      placeholder="e.g., Weekend Trip Fund" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="bg-secondary border border-primary text-secondary-foreground"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-secondary-foreground text-sm mb-2">Description</Label>
                    <Textarea 
                      placeholder="What is this Pot for?" 
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="bg-secondary border border-primary text-secondary-foreground"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-secondary-foreground text-sm mb-2">Target Goal (Dummy Coins)</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-foreground">₡</span>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        min="1"
                        value={goalAmount}
                        onChange={e => setGoalAmount(Number(e.target.value))}
                        className="pl-8 bg-secondary border border-primary text-secondary-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payout Structure */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-4">Payout Structure</h2>
                
                <RadioGroup 
                  value={payoutStructure} 
                  onValueChange={(value) => setPayoutStructure(value as any)}
                  className="space-y-4"
                >
                  <div className={`bg-secondary rounded-lg p-4 ${payoutStructure === "one-to-many" ? "border-2 border-primary" : ""}`}>
                    <div className="flex items-start">
                      <RadioGroupItem value="one-to-many" id="one-to-many" className="mt-1" />
                      <div className="ml-3">
                        <Label htmlFor="one-to-many" className="font-medium text-primary">One-to-Many</Label>
                        <p className="text-sm text-secondary-foreground">One user deposits funds that will be distributed to all members</p>
                        <p className="text-xs text-secondary-foreground mt-1">Example: club leader distributing budgets, parent giving allowances</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`bg-secondary rounded-lg p-4 ${payoutStructure === "many-to-one" ? "border-2 border-primary" : ""}`}>
                    <div className="flex items-start">
                      <RadioGroupItem value="many-to-one" id="many-to-one" className="mt-1" />
                      <div className="ml-3">
                        <Label htmlFor="many-to-one" className="font-medium text-primary">Many-to-One</Label>
                        <p className="text-sm text-secondary-foreground">Multiple users deposit funds for one recipient</p>
                        <p className="text-xs text-secondary-foreground mt-1">Example: gift collection, emergency fund for a friend</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`bg-secondary rounded-lg p-4 ${payoutStructure === "many-to-selected" ? "border-2 border-primary" : ""}`}>
                    <div className="flex items-start">
                      <RadioGroupItem value="many-to-selected" id="many-to-selected" className="mt-1" />
                      <div className="ml-3">
                        <Label htmlFor="many-to-selected" className="font-medium text-primary">Many-to-Selected</Label>
                        <p className="text-sm text-secondary-foreground">Multiple users deposit funds that will be distributed to select members</p>
                        <p className="text-xs text-secondary-foreground mt-1">Example: group trip where only some members need financial support</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Withdrawal Approval */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-4">Withdrawal Approval Method</h2>
                
                <RadioGroup 
                  value={withdrawalMethod} 
                  onValueChange={(value) => setWithdrawalMethod(value as any)}
                  className="space-y-4"
                >
                  <div className={`bg-secondary rounded-lg p-4 ${withdrawalMethod === "democratic" ? "border-2 border-primary" : ""}`}>
                    <div className="flex items-start">
                      <RadioGroupItem value="democratic" id="democratic" className="mt-1" />
                      <div className="ml-3">
                        <Label htmlFor="democratic" className="font-medium text-primary">Democratic Vote</Label>
                        <p className="text-sm text-secondary-foreground">All members must vote; requires majority approval</p>
                        
                        {withdrawalMethod === "democratic" && (
                          <div className="mt-2">
                            <Label className="block text-xs text-secondary-foreground mb-1">Required Approval Percentage</Label>
                            <Select value={voteThreshold} onValueChange={setVoteThreshold}>
                              <SelectTrigger className="w-full bg-secondary border border-primary text-secondary-foreground">
                                <SelectValue placeholder="Select threshold" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="51">51% (Simple Majority)</SelectItem>
                                <SelectItem value="66">66% (Two Thirds)</SelectItem>
                                <SelectItem value="75">75% (Three Quarters)</SelectItem>
                                <SelectItem value="100">100% (Unanimous)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`bg-secondary rounded-lg p-4 ${withdrawalMethod === "admin" ? "border-2 border-primary" : ""}`}>
                    <div className="flex items-start">
                      <RadioGroupItem value="admin" id="admin" className="mt-1" />
                      <div className="ml-3">
                        <Label htmlFor="admin" className="font-medium text-primary">Admin Approval</Label>
                        <p className="text-sm text-secondary-foreground">Pot creator or appointed admin has sole authority to approve withdrawals</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`bg-secondary rounded-lg p-4 ${withdrawalMethod === "timed" ? "border-2 border-primary" : ""}`}>
                    <div className="flex items-start">
                      <RadioGroupItem value="timed" id="timed" className="mt-1" />
                      <div className="ml-3 w-full">
                        <Label htmlFor="timed" className="font-medium text-primary">Timed Release</Label>
                        <p className="text-sm text-secondary-foreground">Funds locked until a specific date</p>
                        
                        {withdrawalMethod === "timed" && (
                          <div className="mt-2">
                            <Label className="block text-xs text-secondary-foreground mb-1">Release Date</Label>
                            <Input 
                              type="date" 
                              value={releaseDate}
                              onChange={e => setReleaseDate(e.target.value)}
                              className="w-full bg-secondary border border-primary text-secondary-foreground"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Invite Members */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-4">Invite Members</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-secondary-foreground text-sm mb-2">Add by Email or Phone</Label>
                    <div className="flex">
                      <Input 
                        type="text" 
                        placeholder="Email or phone number" 
                        value={memberInput}
                        onChange={e => setMemberInput(e.target.value)}
                        className="flex-grow rounded-r-none bg-secondary border border-primary text-secondary-foreground"
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddMember}
                        className="rounded-l-none btn-gradient"
                      >
                        <FaPlus className="mr-2" /> Add
                      </Button>
                    </div>
                  </div>
                  
                  {/* Added members list */}
                  {members.length > 0 && (
                    <div className="bg-secondary rounded-lg p-4">
                      <h3 className="font-medium text-primary mb-2">Added Members</h3>
                      <div className="space-y-2">
                        {members.map(member => (
                          <div key={member.id} className="flex justify-between items-center">
                            <span className="text-secondary-foreground">{member.contact}</span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-destructive hover:text-red-400"
                              aria-label="Remove member"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" className="w-full btn-gradient">
                  Create Pot
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
