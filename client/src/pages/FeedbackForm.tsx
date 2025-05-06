import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { usePot } from "@/context/PotContext";

export default function FeedbackForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addFeedback } = usePot();
  
  const [rating, setRating] = useState<number>(4); // Default to 4 (smile)
  const [likedFeatures, setLikedFeatures] = useState<string[]>([]);
  const [improvements, setImprovements] = useState("");
  const [useReal, setUseReal] = useState<string>("yes");
  const [suggestions, setSuggestions] = useState("");
  
  const handleLikedFeatureToggle = (feature: string) => {
    if (likedFeatures.includes(feature)) {
      setLikedFeatures(likedFeatures.filter(f => f !== feature));
    } else {
      setLikedFeatures([...likedFeatures, feature]);
    }
  };
  
  const handleRatingSelect = (newRating: number) => {
    setRating(newRating);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const feedback = {
      id: Math.random().toString(36).substring(2, 10),
      rating,
      likedFeatures,
      improvements,
      useReal,
      suggestions,
      timestamp: new Date().toISOString()
    };
    
    addFeedback(feedback);
    
    toast({
      title: "Thank you!",
      description: "Your feedback has been submitted successfully."
    });
    
    navigate("/");
  };
  
  return (
    <div className="slide-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Share Your Feedback</h1>
        <p className="text-secondary-foreground">Help us improve The Pot sandbox experience</p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label className="block text-secondary-foreground text-sm mb-2">How would you rate your experience?</Label>
                <div className="flex space-x-4">
                  <button 
                    type="button" 
                    onClick={() => handleRatingSelect(1)}
                    className={`text-4xl cursor-pointer hover:text-primary ${rating === 1 ? 'text-primary' : 'text-secondary-foreground'}`}
                  >
                    😞
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleRatingSelect(2)}
                    className={`text-4xl cursor-pointer hover:text-primary ${rating === 2 ? 'text-primary' : 'text-secondary-foreground'}`}
                  >
                    😐
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleRatingSelect(3)}
                    className={`text-4xl cursor-pointer hover:text-primary ${rating === 3 ? 'text-primary' : 'text-secondary-foreground'}`}
                  >
                    🙂
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleRatingSelect(4)}
                    className={`text-4xl cursor-pointer hover:text-primary ${rating === 4 ? 'text-primary' : 'text-secondary-foreground'}`}
                  >
                    😄
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleRatingSelect(5)}
                    className={`text-4xl cursor-pointer hover:text-primary ${rating === 5 ? 'text-primary' : 'text-secondary-foreground'}`}
                  >
                    🤩
                  </button>
                </div>
              </div>
              
              <div>
                <Label className="block text-secondary-foreground text-sm mb-2">What features did you like the most?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="like-payout" 
                      checked={likedFeatures.includes("payout")}
                      onCheckedChange={() => handleLikedFeatureToggle("payout")}
                    />
                    <label 
                      htmlFor="like-payout" 
                      className="text-secondary-foreground cursor-pointer"
                    >
                      Payout Structures
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="like-withdrawal" 
                      checked={likedFeatures.includes("withdrawal")}
                      onCheckedChange={() => handleLikedFeatureToggle("withdrawal")}
                    />
                    <label 
                      htmlFor="like-withdrawal" 
                      className="text-secondary-foreground cursor-pointer"
                    >
                      Withdrawal Methods
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="like-deposit" 
                      checked={likedFeatures.includes("deposit")}
                      onCheckedChange={() => handleLikedFeatureToggle("deposit")}
                    />
                    <label 
                      htmlFor="like-deposit" 
                      className="text-secondary-foreground cursor-pointer"
                    >
                      Deposit Simulator
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="like-interface" 
                      checked={likedFeatures.includes("interface")}
                      onCheckedChange={() => handleLikedFeatureToggle("interface")}
                    />
                    <label 
                      htmlFor="like-interface" 
                      className="text-secondary-foreground cursor-pointer"
                    >
                      User Interface
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="like-transactions" 
                      checked={likedFeatures.includes("transactions")}
                      onCheckedChange={() => handleLikedFeatureToggle("transactions")}
                    />
                    <label 
                      htmlFor="like-transactions" 
                      className="text-secondary-foreground cursor-pointer"
                    >
                      Transaction Log
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="like-voting" 
                      checked={likedFeatures.includes("voting")}
                      onCheckedChange={() => handleLikedFeatureToggle("voting")}
                    />
                    <label 
                      htmlFor="like-voting" 
                      className="text-secondary-foreground cursor-pointer"
                    >
                      Voting System
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="block text-secondary-foreground text-sm mb-2">What needs improvement?</Label>
                <Textarea 
                  rows={3} 
                  placeholder="Tell us what we could do better..."
                  value={improvements}
                  onChange={e => setImprovements(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-primary rounded-lg text-secondary-foreground"
                />
              </div>
              
              <div>
                <Label className="block text-secondary-foreground text-sm mb-2">Would you use this app with real money?</Label>
                <RadioGroup
                  value={useReal}
                  onValueChange={setUseReal}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="use-yes" />
                    <label htmlFor="use-yes" className="text-secondary-foreground">Yes, definitely</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="use-maybe" />
                    <label htmlFor="use-maybe" className="text-secondary-foreground">Maybe</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="use-no" />
                    <label htmlFor="use-no" className="text-secondary-foreground">No</label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label className="block text-secondary-foreground text-sm mb-2">Any other ideas or suggestions?</Label>
                <Textarea 
                  rows={3} 
                  placeholder="Share any other thoughts..."
                  value={suggestions}
                  onChange={e => setSuggestions(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-primary rounded-lg text-secondary-foreground"
                />
              </div>
              
              <div className="pt-4">
                <Button type="submit" className="w-full btn-gradient">
                  Submit Feedback
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
