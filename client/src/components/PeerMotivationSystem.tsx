import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PotType } from "@/lib/utils";
import { Heart, Zap, Target, TrendingUp, MessageCircle, Send } from "lucide-react";

interface PeerMotivationSystemProps {
  pot: PotType;
  currentUser: string;
  isOpen: boolean;
  onClose: () => void;
}

interface MotivationMessage {
  id: string;
  fromUser: string;
  toUser: string;
  message: string;
  template: string;
  timestamp: string;
  type: 'encouragement' | 'milestone' | 'goal_reminder' | 'custom';
}

const motivationTemplates: Array<{
  id: string;
  type: MotivationMessage['type'];
  icon: any;
  title: string;
  message: string;
  color: string;
}> = [
  {
    id: 'daily_encouragement',
    type: 'encouragement',
    icon: Heart,
    title: 'Daily Encouragement',
    message: "Hey {name}! 🌟 Your contribution brings us closer to our goal. Every bit counts!",
    color: 'bg-pink-100 text-pink-800'
  },
  {
    id: 'goal_push',
    type: 'goal_reminder',
    icon: Target,
    title: 'Goal Push',
    message: "We're {percentage}% there, {name}! 🎯 Your next contribution could be the game-changer!",
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'milestone_celebration',
    type: 'milestone',
    icon: TrendingUp,
    title: 'Milestone Celebration',
    message: "Amazing work {name}! 🚀 We just hit {milestone}% thanks to contributions like yours!",
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'energy_boost',
    type: 'encouragement',
    icon: Zap,
    title: 'Energy Boost',
    message: "Your savings discipline is inspiring, {name}! ⚡ Keep up the momentum!",
    color: 'bg-yellow-100 text-yellow-800'
  }
];

export default function PeerMotivationSystem({ pot, currentUser, isOpen, onClose }: PeerMotivationSystemProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [sentMessages, setSentMessages] = useState<MotivationMessage[]>([]);
  const [showCustomMessage, setShowCustomMessage] = useState<boolean>(false);

  const sendMotivationMessage = () => {
    if (!selectedMember) {
      toast({
        title: "Select a Member",
        description: "Please choose who you want to encourage",
        variant: "destructive"
      });
      return;
    }

    let finalMessage = "";
    let messageType: MotivationMessage['type'] = 'custom';

    if (showCustomMessage && customMessage.trim()) {
      finalMessage = customMessage.trim();
      messageType = 'custom';
    } else if (selectedTemplate) {
      const template = motivationTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        const progressPercentage = Math.round((pot.currentBalance / pot.goalAmount) * 100);
        finalMessage = template.message
          .replace('{name}', selectedMember)
          .replace('{percentage}', progressPercentage.toString())
          .replace('{milestone}', progressPercentage.toString());
        messageType = template.type as MotivationMessage['type'];
      }
    }

    if (!finalMessage) {
      toast({
        title: "No Message",
        description: "Please select a template or write a custom message",
        variant: "destructive"
      });
      return;
    }

    const newMessage: MotivationMessage = {
      id: Date.now().toString(),
      fromUser: currentUser,
      toUser: selectedMember,
      message: finalMessage,
      template: selectedTemplate || 'custom',
      timestamp: new Date().toISOString(),
      type: messageType
    };

    setSentMessages([...sentMessages, newMessage]);

    toast({
      title: "Motivation Sent! 🎉",
      description: `Your encouragement has been sent to ${selectedMember}`,
    });

    // Reset form
    setSelectedTemplate("");
    setCustomMessage("");
    setSelectedMember("");
    setShowCustomMessage(false);
  };

  const getMotivationStats = () => {
    const totalSent = sentMessages.filter(m => m.fromUser === currentUser).length;
    const totalReceived = sentMessages.filter(m => m.toUser === currentUser).length;
    return { totalSent, totalReceived };
  };

  const stats = getMotivationStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span>Peer Motivation System</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalSent}</div>
                <div className="text-sm text-muted-foreground">Messages Sent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalReceived}</div>
                <div className="text-sm text-muted-foreground">Encouragements Received</div>
              </CardContent>
            </Card>
          </div>

          {/* Send Message Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Encouragement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Member Selection */}
              <div>
                <Label className="text-sm font-medium">Choose Member to Encourage</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pot.members.filter(member => member !== currentUser).map((member) => (
                    <Button
                      key={member}
                      variant={selectedMember === member ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMember(member)}
                    >
                      {member}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Template or Custom Toggle */}
              <div className="flex space-x-2">
                <Button
                  variant={!showCustomMessage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCustomMessage(false)}
                >
                  Templates
                </Button>
                <Button
                  variant={showCustomMessage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCustomMessage(true)}
                >
                  Custom Message
                </Button>
              </div>

              {/* Template Selection */}
              {!showCustomMessage && (
                <div>
                  <Label className="text-sm font-medium">Choose Template</Label>
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    {motivationTemplates.map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <div
                          key={template.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedTemplate === template.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <IconComponent className="w-5 h-5 text-primary mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{template.title}</span>
                                <Badge className={template.color}>{template.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.message.replace('{name}', selectedMember || '[Member]')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Message */}
              {showCustomMessage && (
                <div>
                  <Label htmlFor="custom-message" className="text-sm font-medium">
                    Your Custom Message
                  </Label>
                  <Textarea
                    id="custom-message"
                    placeholder="Write a personalized encouragement message..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}

              {/* Send Button */}
              <Button 
                onClick={sendMotivationMessage}
                className="w-full"
                disabled={!selectedMember || (!selectedTemplate && !customMessage.trim())}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Encouragement
              </Button>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          {sentMessages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Motivation Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {sentMessages
                    .slice(-5)
                    .reverse()
                    .map((message) => (
                      <div key={message.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {message.fromUser === currentUser ? 'You' : message.fromUser}
                            </span>
                            <span className="text-muted-foreground text-xs">→</span>
                            <span className="font-medium text-sm">{message.toUser}</span>
                            <Badge variant="secondary" className="text-xs">
                              {message.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{message.message}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}