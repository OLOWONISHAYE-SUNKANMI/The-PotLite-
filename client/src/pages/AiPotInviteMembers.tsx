import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { usePot } from "@/context/PotContext";
import { Label } from "@/components/ui/label";

interface PotDraftData {
  name: string;
  description?: string;
  goalAmount: number;
  payoutStructure: string;
  withdrawalMethod: string;
  voteThreshold?: number;
  releaseDate?: string;
}

export default function AiPotInviteMembers() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addPot } = usePot();
  const [members, setMembers] = useState("");

  // Get the pot draft data from location state
  const potDraft = (window.history.state?.potDraft as PotDraftData) || null;

  // Redirect to AI creator if no pot draft data
  if (!potDraft) {
    navigate("/ai-create");
    return null;
  }

  // Mutation for creating the pot with members
  const createPotMutation = useMutation({
    mutationFn: async (data: { potData: any; members: string }) => {
      const response = await fetch('/api/pots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.potData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create pot');
      }
      
      return { pot: await response.json(), members: data.members };
    },
    onSuccess: (data) => {
      // Parse member list for sandbox display
      const memberList = data.members
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      // Add members array to pot for sandbox display (simulation only)
      const potWithMembers = {
        ...data.pot,
        members: memberList.length > 0 ? memberList : []
      };
      
      // Add the pot to the context state
      addPot(potWithMembers);

      toast({
        title: "Pot Created!",
        description: memberList.length > 0 
          ? `Your pot has been created and ${memberList.length} member invitation(s) sent.`
          : "Your pot has been created successfully.",
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

  const handleCreatePot = () => {
    const potData = {
      name: potDraft.name,
      description: potDraft.description || undefined,
      goalAmount: potDraft.goalAmount,
      payoutStructure: potDraft.payoutStructure,
      withdrawalMethod: potDraft.withdrawalMethod,
      voteThreshold: potDraft.voteThreshold || undefined,
      releaseDate: potDraft.releaseDate ? new Date(potDraft.releaseDate).toISOString() : undefined,
      createdBy: 1, // TODO: Replace with actual user ID
      currentBalance: 0,
    };
    
    createPotMutation.mutate({ potData, members });
  };

  const handleSkipInvites = () => {
    handleCreatePot();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/ai-create")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to AI Planner
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-purple-600" />
              Invite Members to "{potDraft.name}"
            </CardTitle>
            <CardDescription>
              Add members who will participate in this savings pot. You can also skip this step and invite members later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-blue-900">Pot Summary</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Goal:</strong> ₡{potDraft.goalAmount}</p>
                <p><strong>Withdrawal Method:</strong> {potDraft.withdrawalMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                {potDraft.releaseDate && (
                  <p><strong>Release Date:</strong> {new Date(potDraft.releaseDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="members" className="text-base font-medium">
                Invite Members (Optional)
              </Label>
              <Textarea
                id="members"
                placeholder="Enter emails or usernames separated by commas&#10;Example: sarah@email.com, john@email.com, @mike"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                className="min-h-[120px] text-base"
                disabled={createPotMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                This is a sandbox simulation - no actual invites will be sent.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleSkipInvites}
                disabled={createPotMutation.isPending}
                className="flex-1"
              >
                Skip & Create Pot
              </Button>
              <Button
                onClick={handleCreatePot}
                disabled={createPotMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {createPotMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Pot...
                  </>
                ) : (
                  `Invite ${members.split(',').filter(m => m.trim()).length || 0} & Create Pot`
                )}
              </Button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800">
              <strong>What happens next?</strong> Once you create the pot, invited members will receive notifications to join. 
              You can always invite more members later from the pot dashboard.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
