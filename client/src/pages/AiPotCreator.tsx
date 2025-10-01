import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { AiPotDraft } from "@shared/schema";

export default function AiPotCreator() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [aiDraft, setAiDraft] = useState<AiPotDraft | null>(null);
  
  // Editable form state for confirmation modal
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedGoalAmount, setEditedGoalAmount] = useState(0);
  const [editedPayoutStructure, setEditedPayoutStructure] = useState<"one-to-many" | "many-to-one" | "many-to-selected">("one-to-many");
  const [editedWithdrawalMethod, setEditedWithdrawalMethod] = useState<"democratic_vote" | "admin_approval" | "timed_release" | "auto_withdraw">("admin_approval");
  const [editedVoteThreshold, setEditedVoteThreshold] = useState<number | undefined>();
  const [editedReleaseDate, setEditedReleaseDate] = useState<string | undefined>();

  // Mutation for generating AI draft
  const generateDraftMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      const response = await fetch('/api/pots/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userPrompt, 
          userId: 1 // TODO: Replace with actual user ID from context
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate pot draft');
      }
      
      return response.json();
    },
    onSuccess: (data: { draft: AiPotDraft; status: string }) => {
      const draft = data.draft;
      setAiDraft(draft);
      
      // Pre-fill the editable form
      setEditedName(draft.name);
      setEditedDescription(draft.description || "");
      setEditedGoalAmount(draft.goalAmount);
      setEditedPayoutStructure(draft.payoutStructure);
      setEditedWithdrawalMethod(draft.withdrawalMethod);
      setEditedVoteThreshold(draft.voteThreshold);
      setEditedReleaseDate(draft.releaseDate);
      
      // Show confirmation modal
      setShowConfirmModal(true);
      
      toast({
        title: "Draft Generated!",
        description: "Please review the pot details and make any adjustments.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for creating the pot
  const createPotMutation = useMutation({
    mutationFn: async (potData: any) => {
      const response = await fetch('/api/pots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(potData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create pot');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pots'] });
      toast({
        title: "Pot Created!",
        description: "Your pot has been successfully created.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateDraft = () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please describe the pot you want to create.",
        variant: "destructive",
      });
      return;
    }
    
    generateDraftMutation.mutate(prompt);
  };

  const handleCreatePot = () => {
    const potData = {
      name: editedName,
      description: editedDescription,
      goalAmount: editedGoalAmount,
      payoutStructure: editedPayoutStructure,
      withdrawalMethod: editedWithdrawalMethod,
      voteThreshold: editedVoteThreshold,
      releaseDate: editedReleaseDate ? new Date(editedReleaseDate) : null,
      createdBy: 1, // TODO: Replace with actual user ID
      currentBalance: 0,
    };
    
    createPotMutation.mutate(potData);
  };

  const examplePrompts = [
    "Create a vacation fund for Hawaii trip with $3000 goal",
    "Set up a rent splitting pot for 4 roommates at $1200/month",
    "Birthday gift collection for Sarah, need $500 by June 15th",
    "Emergency fund with democratic voting for withdrawals"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-purple-600" />
              AI Pot Creator
            </CardTitle>
            <CardDescription>
              Describe your savings goal in plain English, and our AI will create the perfect pot for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-base font-medium">
                What do you want to save for?
              </Label>
              <Textarea
                id="prompt"
                placeholder="Example: I want to save $2,000 for a summer vacation with my friends. We need the money by July 1st, and everyone should contribute equally..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[150px] text-base"
                disabled={generateDraftMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Need inspiration? Try these examples:
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {examplePrompts.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(example)}
                    disabled={generateDraftMutation.isPending}
                    className="text-left justify-start h-auto py-3 px-3 text-sm"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateDraft}
              disabled={generateDraftMutation.isPending || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              {generateDraftMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Your Pot...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Pot with AI
                </>
              )}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <strong>How it works:</strong> Our AI will analyze your description and automatically configure the pot's goal amount, payout structure, withdrawal method, and timeline. You'll be able to review and edit everything before creating the pot.
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Pot</DialogTitle>
              <DialogDescription>
                The AI has generated these details for your pot. Feel free to make any adjustments before creating it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pot Name</Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalAmount">Goal Amount (₡)</Label>
                <Input
                  id="goalAmount"
                  type="number"
                  value={editedGoalAmount}
                  onChange={(e) => setEditedGoalAmount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payoutStructure">Payout Structure</Label>
                <Select value={editedPayoutStructure} onValueChange={(val) => setEditedPayoutStructure(val as any)}>
                  <SelectTrigger id="payoutStructure">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-to-many">One-to-Many (Single depositor, multiple recipients)</SelectItem>
                    <SelectItem value="many-to-one">Many-to-One (Multiple depositors, single recipient)</SelectItem>
                    <SelectItem value="many-to-selected">Many-to-Selected (Multiple depositors, selected recipients)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawalMethod">Withdrawal Method</Label>
                <Select value={editedWithdrawalMethod} onValueChange={(val) => setEditedWithdrawalMethod(val as any)}>
                  <SelectTrigger id="withdrawalMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="democratic_vote">Democratic Vote</SelectItem>
                    <SelectItem value="admin_approval">Admin Approval</SelectItem>
                    <SelectItem value="timed_release">Timed Release</SelectItem>
                    <SelectItem value="auto_withdraw">Auto Withdraw</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editedWithdrawalMethod === "democratic_vote" && (
                <div className="space-y-2">
                  <Label htmlFor="voteThreshold">Vote Threshold (%)</Label>
                  <Input
                    id="voteThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={editedVoteThreshold || 75}
                    onChange={(e) => setEditedVoteThreshold(Number(e.target.value))}
                  />
                </div>
              )}

              {editedWithdrawalMethod === "timed_release" && (
                <div className="space-y-2">
                  <Label htmlFor="releaseDate">Release Date</Label>
                  <Input
                    id="releaseDate"
                    type="datetime-local"
                    value={editedReleaseDate || ""}
                    onChange={(e) => setEditedReleaseDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={createPotMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePot}
                disabled={createPotMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {createPotMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Pot"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
