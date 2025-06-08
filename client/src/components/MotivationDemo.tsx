import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Zap, Target, TrendingUp, MessageCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MotivationDemoProps {
  onClose: () => void;
}

export default function MotivationDemo({ onClose }: MotivationDemoProps) {
  const { toast } = useToast();
  const [activeDemo, setActiveDemo] = useState<string>("");

  const demoScenarios = [
    {
      id: "goal_approaching",
      title: "Goal Approaching (85% Complete)",
      icon: Target,
      description: "Motivate team when close to reaching the goal",
      potProgress: 85,
      color: "bg-blue-100 text-blue-800",
      messages: [
        "We're 85% there, Sarah! 🎯 Your next contribution could be the game-changer!",
        "Amazing work Alex! 🚀 We just hit 85% thanks to contributions like yours!",
        "Your savings discipline is inspiring, Mike! ⚡ Keep up the momentum!"
      ]
    },
    {
      id: "slow_progress",
      title: "Slow Progress (25% Complete)",
      icon: Heart,
      description: "Encourage participation when progress is slow",
      potProgress: 25,
      color: "bg-pink-100 text-pink-800",
      messages: [
        "Hey John! 🌟 Your contribution brings us closer to our goal. Every bit counts!",
        "We believe in this goal together! 💪 Even small contributions make a big difference.",
        "Your commitment to saving is what makes this pot special! 🌱"
      ]
    },
    {
      id: "milestone_celebration",
      title: "Milestone Reached (50% Complete)",
      icon: TrendingUp,
      description: "Celebrate achievements and maintain momentum",
      potProgress: 50,
      color: "bg-green-100 text-green-800",
      messages: [
        "Halfway there! 🎉 This team is unstoppable when we work together!",
        "50% milestone reached! 🚀 Your consistency is paying off beautifully!",
        "Look what we've achieved together! 💚 The finish line is getting closer!"
      ]
    },
    {
      id: "energy_boost",
      title: "Weekly Energy Boost",
      icon: Zap,
      description: "Regular motivation to keep engagement high",
      potProgress: 65,
      color: "bg-yellow-100 text-yellow-800",
      messages: [
        "Monday motivation! ⚡ Your financial discipline inspires the whole team!",
        "Midweek check-in! 🔥 You're building something amazing with every contribution!",
        "Friday fuel! 💫 Your commitment this week has been outstanding!"
      ]
    }
  ];

  const simulateMotivation = (scenarioId: string) => {
    const scenario = demoScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    setActiveDemo(scenarioId);
    
    toast({
      title: "Motivation Sent! 🎉",
      description: `Encouragement messages sent to all pot members`,
    });

    // Auto-close demo after showing messages
    setTimeout(() => {
      setActiveDemo("");
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Peer Motivation System Demo</h2>
        <p className="text-muted-foreground">See how customizable encouragement messages boost pot engagement</p>
      </div>

      {/* Demo Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoScenarios.map((scenario) => {
          const IconComponent = scenario.icon;
          return (
            <Card key={scenario.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <IconComponent className="w-5 h-5 text-primary" />
                  <span>{scenario.title}</span>
                  <Badge className={scenario.color}>{scenario.potProgress}%</Badge>
                </CardTitle>
                <Progress value={scenario.potProgress} className="h-2" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{scenario.description}</p>
                
                {activeDemo === scenario.id && (
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-sm">Generated Messages:</h4>
                    {scenario.messages.map((message, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                        {message}
                      </div>
                    ))}
                  </div>
                )}
                
                <Button 
                  onClick={() => simulateMotivation(scenario.id)}
                  disabled={activeDemo === scenario.id}
                  size="sm"
                  className="w-full"
                >
                  {activeDemo === scenario.id ? "Messages Sent!" : "Send Motivation"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span>System Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium">Smart Templates</h4>
              <p className="text-xs text-muted-foreground mt-1">Pre-built messages adapt to pot progress and milestones</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium">Peer-to-Peer</h4>
              <p className="text-xs text-muted-foreground mt-1">Members can encourage each other directly</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium">Custom Messages</h4>
              <p className="text-xs text-muted-foreground mt-1">Write personalized encouragement messages</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={onClose} variant="outline">
          Close Demo
        </Button>
      </div>
    </div>
  );
}