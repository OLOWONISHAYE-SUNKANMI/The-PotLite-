import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { FaUserPlus, FaEnvelope, FaShare, FaCopy, FaWhatsapp, FaFacebook, FaTwitter } from "react-icons/fa";
import { PotType } from "@/lib/utils";

interface PotInviteSystemProps {
  pot: PotType;
  isOpen: boolean;
  onClose: () => void;
}

export default function PotInviteSystem({ pot, isOpen, onClose }: PotInviteSystemProps) {
  const { toast } = useToast();
  const [inviteEmails, setInviteEmails] = useState<string>("");
  const [personalMessage, setPersonalMessage] = useState<string>("");
  const [inviteLink] = useState<string>(`https://thepot.app/join/${pot.id}`);

  const handleSendInvites = () => {
    const emails = inviteEmails.split(',').map(email => email.trim()).filter(email => email);
    
    if (emails.length === 0) {
      toast({
        title: "No emails provided",
        description: "Please enter at least one email address",
        variant: "destructive"
      });
      return;
    }

    // Simulate sending invites
    toast({
      title: "Invites Sent!",
      description: `Sent ${emails.length} personalized invitations for "${pot.name}"`,
    });
    
    setInviteEmails("");
    setPersonalMessage("");
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link Copied!",
      description: "Invite link has been copied to your clipboard",
    });
  };

  const shareToSocial = (platform: string) => {
    const message = `Join my savings pot "${pot.name}"! We're saving together to reach our goal of ₡${pot.goalAmount}. ${inviteLink}`;
    
    let shareUrl = "";
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
      toast({
        title: "Shared!",
        description: `Opened ${platform} to share your pot invitation`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FaUserPlus className="mr-2 text-primary" />
            Invite Members to "{pot.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pot Preview Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/30">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{pot.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{pot.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {pot.payoutStructure}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-primary">Goal Amount</p>
                    <p className="text-lg font-bold text-green-600">₡{pot.goalAmount}</p>
                  </div>
                  <div>
                    <p className="font-medium text-primary">Current Balance</p>
                    <p className="text-lg font-bold text-blue-600">₡{pot.currentBalance}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{Math.round((pot.currentBalance / pot.goalAmount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((pot.currentBalance / pot.goalAmount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Email Invites Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary flex items-center">
              <FaEnvelope className="mr-2" />
              Send Email Invitations
            </h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="emails">Email Addresses</Label>
                <Textarea
                  id="emails"
                  placeholder="Enter email addresses separated by commas&#10;example@email.com, friend@email.com"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  className="mt-1 h-20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple emails with commas
                </p>
              </div>
              
              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal touch to your invitation..."
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  className="mt-1 h-20"
                />
              </div>
              
              <Button onClick={handleSendInvites} className="w-full">
                <FaEnvelope className="mr-2" />
                Send Invitations
              </Button>
            </div>
          </div>

          {/* Share Link Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary flex items-center">
              <FaShare className="mr-2" />
              Share Invite Link
            </h4>
            
            <div className="flex space-x-2">
              <Input 
                value={inviteLink} 
                readOnly 
                className="flex-1 bg-gray-50"
              />
              <Button 
                variant="outline" 
                onClick={copyInviteLink}
                className="px-3"
              >
                <FaCopy />
              </Button>
            </div>
            
            {/* Social Media Sharing */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => shareToSocial('whatsapp')}
                className="flex items-center justify-center space-x-2 text-green-600 hover:bg-green-50"
              >
                <FaWhatsapp />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => shareToSocial('facebook')}
                className="flex items-center justify-center space-x-2 text-blue-600 hover:bg-blue-50"
              >
                <FaFacebook />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => shareToSocial('twitter')}
                className="flex items-center justify-center space-x-2 text-blue-400 hover:bg-blue-50"
              >
                <FaTwitter />
                <span className="text-xs">Twitter</span>
              </Button>
            </div>
          </div>

          {/* Current Members */}
          <div className="space-y-3">
            <h4 className="font-semibold text-primary">Current Members ({pot.members.length})</h4>
            <div className="flex flex-wrap gap-2">
              {pot.members.map((member, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800"
                >
                  {member}
                  {member === pot.creator && " 👑"}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}