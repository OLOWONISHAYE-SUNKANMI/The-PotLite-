import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { usePot } from '@/context/PotContext';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onClose }) => {
  const { toast } = useToast();
  const { addFeedback } = usePot();
  
  const [easyToUnderstand, setEasyToUnderstand] = useState("");
  const [standoutFeature, setStandoutFeature] = useState("");
  const [wouldUse, setWouldUse] = useState("");
  
  const handleSubmit = () => {
    // Validate inputs
    if (!easyToUnderstand || !standoutFeature || !wouldUse) {
      toast({
        title: "Please complete all fields",
        description: "We need your feedback on all questions before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    // Create feedback object
    const feedback = {
      id: Math.random().toString(36).substring(2, 10),
      rating: 5, // Default high rating for completion
      sandboxCompletionFeedback: {
        easyToUnderstand,
        standoutFeature,
        wouldUse
      },
      timestamp: new Date().toISOString()
    };
    
    // Add feedback to context
    addFeedback(feedback);
    
    // Show success toast
    toast({
      title: "Thank you!",
      description: "Your feedback has been submitted successfully."
    });
    
    // Close modal
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center">
            🎉 You've completed The Pot Sandbox Test!
          </DialogTitle>
          <DialogDescription>
            Thanks for testing the core features of The Pot. Please leave a few thoughts before exiting.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="understand">Was the experience easy to understand?</Label>
            <Textarea 
              id="understand" 
              placeholder="Share your thoughts on the app's clarity and user experience..."
              value={easyToUnderstand}
              onChange={(e) => setEasyToUnderstand(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="standout">Which feature stood out to you the most?</Label>
            <Textarea 
              id="standout" 
              placeholder="Tell us which feature you found most useful or interesting..."
              value={standoutFeature}
              onChange={(e) => setStandoutFeature(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="use">Would you use this for your own groups?</Label>
            <Textarea 
              id="use" 
              placeholder="Would you use The Pot for your own group savings needs? Why or why not?"
              value={wouldUse}
              onChange={(e) => setWouldUse(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full sm:w-auto btn-gradient">
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;