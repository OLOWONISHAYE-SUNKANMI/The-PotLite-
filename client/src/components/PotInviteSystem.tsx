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
import { FaUserPlus, FaEnvelope, FaShare, FaCopy, FaFacebook, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
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
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<string | null>(null);
  const [showRemovalConfirm, setShowRemovalConfirm] = useState<boolean>(false);

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
      case 'instagram':
        // Instagram doesn't have direct sharing, so copy to clipboard
        navigator.clipboard.writeText(message);
        toast({
          title: "Copied for Instagram!",
          description: "Message copied to clipboard. Open Instagram and paste in your story or post.",
        });
        return;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;
        break;
      case 'tiktok':
        // TikTok doesn't have direct sharing, so copy to clipboard
        navigator.clipboard.writeText(message);
        toast({
          title: "Copied for TikTok!",
          description: "Message copied to clipboard. Open TikTok and paste in your video description.",
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
      toast({
        title: "Shared!",
        description: `Opened ${platform} to share your pot invitation`,
      });
    }
  };

  const handleMemberClick = (member: string) => {
    if (member === pot.creator) {
      toast({
        title: "Cannot Remove Creator",
        description: "The pot creator cannot be removed from the pot",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedMemberToRemove(member);
    setShowRemovalConfirm(true);
  };

  const confirmRemoveMember = () => {
    if (selectedMemberToRemove) {
      toast({
        title: "Removal Request Sent",
        description: `Request to remove ${selectedMemberToRemove} has been sent to the admin for approval`,
      });
      setShowRemovalConfirm(false);
      setSelectedMemberToRemove(null);
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
                onClick={() => shareToSocial('instagram')}
                className="flex items-center justify-center space-x-2 text-pink-600 hover:bg-pink-50"
              >
                <FaInstagram />
                <span className="text-xs">Instagram</span>
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
                onClick={() => shareToSocial('tiktok')}
                className="flex items-center justify-center space-x-2 text-black hover:bg-gray-50"
              >
                <SiTiktok />
                <span className="text-xs">TikTok</span>
              </Button>
            </div>
          </div>

          {/* Current Members */}
          <div className="space-y-3">
            <h4 className="font-semibold text-primary">
              Current Members ({pot.members.length}) 
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (select user to remove)
              </span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {pot.members.map((member, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className={`cursor-pointer transition-colors ${
                    member === pot.creator 
                      ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-800 hover:bg-red-100 hover:text-red-800'
                  }`}
                  onClick={() => handleMemberClick(member)}
                >
                  {member}
                  {member === pot.creator && " 👑"}
                </Badge>
              ))}
            </div>
          </div>

          {/* Member Removal Confirmation Dialog */}
          <Dialog open={showRemovalConfirm} onOpenChange={setShowRemovalConfirm}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Remove Member?</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Remove <strong>{selectedMemberToRemove}</strong> from "{pot.name}"?
                </p>
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                  ⚠️ This will send the admin a notification requiring their approval for member removal.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRemovalConfirm(false)}
                  >
                    No
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmRemoveMember}
                  >
                    Yes, Remove
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}