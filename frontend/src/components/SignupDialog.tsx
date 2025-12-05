import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner@2.0.3";

interface SignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupSuccess: () => void;
}

export function SignupDialog({ open, onOpenChange, onSignupSuccess }: SignupDialogProps) {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = () => {
    // 입력값 검증
    if (!userId || !username || !email || !password || !confirmPassword) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    // 기존 사용자 확인
    const users = JSON.parse(localStorage.getItem("tripgpt_users") || "[]");
    const existingUser = users.find((u: any) => u.userId === userId);
    
    if (existingUser) {
      toast.error("이미 사용 중인 아이디입니다.");
      return;
    }

    // 새 사용자 추가
    const newUser = {
      userId,
      username,
      email,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem("tripgpt_users", JSON.stringify(users));

    toast.success("회원가입이 완료되었습니다!");
    
    // 입력값 초기화
    setUserId("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    
    // 다이얼로그 닫고 로그인 다이얼로그 열기
    onOpenChange(false);
    onSignupSuccess();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSignup();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>회원가입</DialogTitle>
          <DialogDescription>
            TripGpt에 가입하여 다양한 여행지를 추천받아보세요
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="signup-userid">아이디</Label>
            <Input
              id="signup-userid"
              type="text"
              placeholder="아이디를 입력하세요"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-username">사용자 이름</Label>
            <Input
              id="signup-username"
              type="text"
              placeholder="이름을 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">이메일</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">비밀번호</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password">비밀번호 확인</Label>
            <Input
              id="signup-confirm-password"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button className="w-full" onClick={handleSignup}>
            가입하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}