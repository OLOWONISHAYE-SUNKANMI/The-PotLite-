import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePot } from "@/context/PotContext";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/utils";
import { FaPlus, FaTimes, FaCoins, FaUtensils, FaCaretDown, FaUserPlus, FaInfo } from "react-icons/fa";

type Member = {
  id: string;
  contact: string;
};

export default function CreatePot() {
  const { addPot } = usePot();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedUseCase, setSelectedUseCase] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState<number>(500);
  const [payoutStructure, setPayoutStructure] = useState<"one-to-many" | "many-to-one" | "many-to-selected">("one-to-many");
  const [withdrawalMethod, setWithdrawalMethod] = useState<"democratic" | "admin" | "timed" | "auto-withdraw">("democratic");
  
  // Set allowed withdrawal methods based on payout structure
  useEffect(() => {
    // Reset withdrawal method if current one isn't allowed for the selected payout structure
    if (payoutStructure === "one-to-many") {
      if (withdrawalMethod === "admin") {
        setWithdrawalMethod("democratic");
      }
    } else if (payoutStructure === "many-to-one") {
      if (withdrawalMethod === "admin" || withdrawalMethod === "democratic") {
        setWithdrawalMethod("timed");
      }
    } else if (payoutStructure === "many-to-selected") {
      if (withdrawalMethod === "admin" || withdrawalMethod === "timed") {
        setWithdrawalMethod("democratic");
      }
    }
  }, [payoutStructure, withdrawalMethod]);
  const [voteThreshold, setVoteThreshold] = useState<string>("75");
  const [releaseDate, setReleaseDate] = useState<string>("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<Member[]>([
    // Admin is included by default
    { id: "admin-user", contact: "admin@thepot.com" }
  ]);
  const [recentMembers] = useState<string[]>(["john@example.com", "sarah@example.com", "mike@example.com", "alex@example.com"]);
  const [memberContributions, setMemberContributions] = useState<Record<string, number>>({});
  const [memberPayouts, setMemberPayouts] = useState<Record<string, number>>({});
  const [potCreationError, setPotCreationError] = useState<string>("");
  
  const handleAddMember = () => {
    if (!memberInput.trim()) return;
    
    const newMember = {
      id: generateId(),
      contact: memberInput.trim(),
    };
    
    setMembers([...members, newMember]);
    setMemberInput("");
  };
  
  const handleAddRecentMember = (contact: string) => {
    // Check if this member is already added
    if (members.some(m => m.contact === contact)) {
      return;
    }
    
    const newMember = {
      id: generateId(),
      contact,
    };
    
    setMembers([...members, newMember]);
  };
  
  const handleRemoveMember = (id: string) => {
    // Don't allow removing the admin
    if (id === "admin-user") {
      toast({
        title: "Cannot Remove Admin",
        description: "The admin must remain a member of the pot.",
        variant: "destructive",
      });
      return;
    }
    
    setMembers(members.filter(member => member.id !== id));
    
    // Also remove any contributions or payouts for this member
    const member = members.find(m => m.id === id);
    if (member) {
      const updatedContributions = { ...memberContributions };
      const updatedPayouts = { ...memberPayouts };
      
      delete updatedContributions[member.contact];
      delete updatedPayouts[member.contact];
      
      setMemberContributions(updatedContributions);
      setMemberPayouts(updatedPayouts);
    }
  };
  
  const toggleMemberContribution = (contact: string) => {
    const updatedContributions = { ...memberContributions };
    
    if (updatedContributions[contact] !== undefined) {
      // If contribution exists, remove it (deselect)
      delete updatedContributions[contact];
    } else {
      // If no contribution, add it with default value (select)
      updatedContributions[contact] = 0; // Default value, will be updated with input
    }
    
    setMemberContributions(updatedContributions);
  };
  
  const setMemberContributionAmount = (contact: string, amount: number) => {
    setMemberContributions({
      ...memberContributions,
      [contact]: amount
    });
  };
  
  const toggleMemberPayout = (contact: string) => {
    const updatedPayouts = { ...memberPayouts };
    
    if (updatedPayouts[contact] !== undefined) {
      // If payout exists, remove it (deselect)
      delete updatedPayouts[contact];
    } else {
      // Check for Many-to-One rule: only one recipient allowed
      if (payoutStructure === "many-to-one" && Object.keys(memberPayouts).length > 0) {
        toast({
          title: "Error",
          description: "Only one recipient is allowed with Many-to-One payout structure.",
          variant: "destructive",
        });
        return;
      }
      
      // Check for Many-to-Selected rule: cannot select all members
      if (payoutStructure === "many-to-selected" && Object.keys(updatedPayouts).length >= members.length - 1) {
        toast({
          title: "Error",
          description: "At least one member must be left without payout in Many-to-Selected structure.",
          variant: "destructive",
        });
        return;
      }
      
      // If no payout, add it with default value (select)
      updatedPayouts[contact] = 0; // Default value, will be updated with input
    }
    
    setMemberPayouts(updatedPayouts);
  };
  
  const setMemberPayoutAmount = (contact: string, amount: number) => {
    setMemberPayouts({
      ...memberPayouts,
      [contact]: amount
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous error
    setPotCreationError("");
    
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
    
    // Validate payout structure rules
    if (payoutStructure === "many-to-one") {
      if (Object.keys(memberPayouts).length !== 1) {
        setPotCreationError("Many-to-One structure requires exactly one recipient");
        setTimeout(() => setPotCreationError(""), 5000);
        return;
      }
    }
    
    if (payoutStructure === "many-to-selected") {
      if (Object.keys(memberPayouts).length >= members.length) {
        setPotCreationError("Many-to-Selected structure requires at least one non-recipient member");
        setTimeout(() => setPotCreationError(""), 5000);
        return;
      }
    }
    
    // Determine recipients based on payouts and payout structure
    let potRecipients: string[] = [];
    
    if (Object.keys(memberPayouts).length > 0) {
      // Use members that have been marked as recipients with payout amounts
      potRecipients = Object.keys(memberPayouts);
    } else {
      // Fall back to default logic
      potRecipients = payoutStructure === "one-to-many" 
        ? members.map(m => m.contact)
        : payoutStructure === "many-to-one"
          ? ["Sarah"] // Default for demo
          : ["Selected Members"]; // For many-to-selected
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
      creator: "admin@thepot.com", // Admin as creator
      createdBy: "admin@thepot.com",
      members: members.map(m => m.contact),
      recipients: potRecipients,
      memberContributions: Object.keys(memberContributions).length > 0 ? memberContributions : undefined,
      memberPayouts: Object.keys(memberPayouts).length > 0 ? memberPayouts : undefined,
      createdAt: new Date().toISOString(),
      status: 'active' as const
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
              {/* Select Use Case */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-4">Select Use</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`bg-secondary rounded-lg p-4 cursor-pointer transition-all ${selectedUseCase === "bills-rent" ? "border-2 border-primary" : "border border-primary/30"}`}
                    onClick={() => setSelectedUseCase("bills-rent")}
                  >
                    <div className="font-medium text-primary">Bills/Rent</div>
                    <p className="text-sm text-secondary-foreground mt-1">Pay Group Shared Netflix Bill; Accumulate Shared Rental Payment in One Place!</p>
                  </div>
                  
                  <div 
                    className={`bg-secondary rounded-lg p-4 cursor-pointer transition-all ${selectedUseCase === "trip-planning" ? "border-2 border-primary" : "border border-primary/30"}`}
                    onClick={() => setSelectedUseCase("trip-planning")}
                  >
                    <div className="font-medium text-primary">Trip Planning</div>
                    <p className="text-sm text-secondary-foreground mt-1">Save for a Group trip Together; Manage Splitting Payments Amongst Each Other!</p>
                  </div>
                  
                  <div 
                    className={`bg-secondary rounded-lg p-4 cursor-pointer transition-all ${selectedUseCase === "gift-collaboration" ? "border-2 border-primary" : "border border-primary/30"}`}
                    onClick={() => setSelectedUseCase("gift-collaboration")}
                  >
                    <div className="font-medium text-primary">Gift Collaboration</div>
                    <p className="text-sm text-secondary-foreground mt-1">Collectively pay someone; Save Together to buy a Gift!</p>
                  </div>
                  
                  <div 
                    className={`bg-secondary rounded-lg p-4 cursor-pointer transition-all ${selectedUseCase === "event-fundraiser" ? "border-2 border-primary" : "border border-primary/30"}`}
                    onClick={() => setSelectedUseCase("event-fundraiser")}
                  >
                    <div className="font-medium text-primary">Event Fundraiser</div>
                    <p className="text-sm text-secondary-foreground mt-1">Contribute to Hosting an Event all in one place!</p>
                  </div>
                  
                  <div 
                    className={`bg-secondary rounded-lg p-4 cursor-pointer transition-all ${selectedUseCase === "team-club-dues" ? "border-2 border-primary" : "border border-primary/30"}`}
                    onClick={() => setSelectedUseCase("team-club-dues")}
                  >
                    <div className="font-medium text-primary">Team/Club Dues</div>
                    <p className="text-sm text-secondary-foreground mt-1">Collect Team Dues with Ease!</p>
                  </div>
                </div>
              </div>
              
              {/* Basic Pot Information */}
              <div className={selectedUseCase ? "" : "opacity-50 pointer-events-none"}>
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
              <div className={selectedUseCase ? "" : "opacity-50 pointer-events-none"}>
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
              <div className={selectedUseCase ? "" : "opacity-50 pointer-events-none"}>
                <h2 className="text-xl font-bold text-primary mb-4">Withdrawal Approval Method</h2>
                
                <RadioGroup 
                  value={withdrawalMethod} 
                  onValueChange={(value) => setWithdrawalMethod(value as any)}
                  className="space-y-4"
                >
                  {/* Democratic Vote - show for one-to-many and many-to-selected */}
                  {(payoutStructure === "one-to-many" || payoutStructure === "many-to-selected") && (
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
                  )}
                  
                  {/* Timed Release - show for one-to-many and many-to-one */}
                  {(payoutStructure === "one-to-many" || payoutStructure === "many-to-one") && (
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
                  )}
                  
                  {/* Auto-Withdraw - show for all payout structures */}
                  <div className={`bg-secondary rounded-lg p-4 ${withdrawalMethod === "auto-withdraw" ? "border-2 border-primary" : ""}`}>
                    <div className="flex items-start">
                      <RadioGroupItem value="auto-withdraw" id="auto-withdraw" className="mt-1" />
                      <div className="ml-3">
                        <Label htmlFor="auto-withdraw" className="font-medium text-primary">Auto-Withdraw</Label>
                        <p className="text-sm text-secondary-foreground">Recipients will automatically receive payouts in their Personal Pot Wallet</p>
                        <p className="text-xs text-secondary-foreground mt-1">Recipients will receive a notification when funds are deposited</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Invite Members */}
              <div className={selectedUseCase ? "" : "opacity-50 pointer-events-none"}>
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                  Invite Members
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 rounded-full p-0">
                          <FaInfo className="h-3 w-3 text-primary" />
                          <span className="sr-only">Member Settings Info</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Configure who contributes and receives payouts from this Pot</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h2>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex flex-1">
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
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="bg-secondary border border-primary text-secondary-foreground">
                          <FaUserPlus className="mr-2" /> Recent Members <FaCaretDown className="ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-0">
                        <div className="bg-secondary border border-primary rounded-md overflow-hidden">
                          {recentMembers.map(contact => (
                            <Button
                              key={contact}
                              variant="ghost"
                              className="w-full justify-start rounded-none border-b border-primary/10 text-sm p-3"
                              onClick={() => handleAddRecentMember(contact)}
                            >
                              {contact}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Member Table */}
                  {members.length > 0 && (
                    <div className="bg-secondary rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-primary">Added Members</h3>
                        <div className="flex items-center gap-3 text-xs text-secondary-foreground">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-gray-400 rounded-sm mr-1"></span>
                            <span>No contribution/payout</span>
                          </div>
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-amber-400 rounded-sm mr-1"></span>
                            <span>Will contribute/receive payout</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="text-left border-b border-primary/20">
                              <th className="pb-2 font-medium text-primary">Contact</th>
                              <th className="pb-2 font-medium text-primary text-center">Contribution?</th>
                              <th className="pb-2 font-medium text-primary text-center">Payout?</th>
                              <th className="pb-2 font-medium text-primary text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {members.map(member => (
                              <tr key={member.id} className="border-b border-primary/10 hover:bg-primary/5">
                                <td className="py-2 text-secondary-foreground">
                                  {member.id === "admin-user" ? (
                                    <div className="flex items-center">
                                      <span>{member.contact}</span>
                                      <span className="text-amber-400 ml-2">👑</span>
                                    </div>
                                  ) : (
                                    member.contact
                                  )}
                                </td>
                                
                                {/* Contribution Column */}
                                <td className="py-2">
                                  <div className="flex flex-col items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleMemberContribution(member.contact)}
                                      className="p-1 rounded-full focus:outline-none transition-transform hover:scale-110"
                                      aria-label={
                                        memberContributions[member.contact] 
                                          ? "Remove contribution" 
                                          : "Add contribution"
                                      }
                                    >
                                      <FaUtensils 
                                        className={
                                          memberContributions[member.contact] !== undefined
                                            ? "text-amber-400" 
                                            : "text-gray-400"
                                        } 
                                        size={20} 
                                      />
                                    </button>
                                    
                                    {memberContributions[member.contact] !== undefined && (
                                      <div className="mt-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          value={memberContributions[member.contact] || ""}
                                          onChange={(e) => setMemberContributionAmount(
                                            member.contact, 
                                            Number(e.target.value)
                                          )}
                                          className="w-20 h-7 text-sm text-center"
                                          placeholder="$"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                
                                {/* Payout Column */}
                                <td className="py-2">
                                  <div className="flex flex-col items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleMemberPayout(member.contact)}
                                      className="p-1 rounded-full focus:outline-none transition-transform hover:scale-110"
                                      aria-label={
                                        memberPayouts[member.contact] 
                                          ? "Remove payout" 
                                          : "Add payout"
                                      }
                                    >
                                      <FaCoins 
                                        className={
                                          memberPayouts[member.contact] !== undefined
                                            ? "text-amber-400" 
                                            : "text-gray-400"
                                        } 
                                        size={20} 
                                      />
                                    </button>
                                    
                                    {memberPayouts[member.contact] !== undefined && (
                                      <div className="mt-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          value={memberPayouts[member.contact] || ""}
                                          onChange={(e) => setMemberPayoutAmount(
                                            member.contact, 
                                            Number(e.target.value)
                                          )}
                                          className="w-20 h-7 text-sm text-center"
                                          placeholder="$"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                
                                {/* Actions Column */}
                                <td className="py-2 text-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="text-destructive p-1 rounded-full hover:bg-destructive/10 transition-colors"
                                    aria-label="Remove member"
                                  >
                                    <FaTimes />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Error Message */}
              {potCreationError && (
                <div className="my-4 p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-center">
                  {potCreationError}
                </div>
              )}
              
              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full btn-gradient"
                  disabled={!selectedUseCase}
                >
                  {selectedUseCase ? "Create Pot" : "Select a Use Case First"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
