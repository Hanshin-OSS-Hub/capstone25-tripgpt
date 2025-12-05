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
import { UserPlus } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupClick: () => void;
  onLoginSuccess: (user: any) => void;
}

export function LoginDialog({ open, onOpenChange, onSignupClick, onLoginSuccess }: LoginDialogProps) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // 입력값 검증
    if (!userId || !password) {
      toast.error("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    // 사용자 확인
    const users = JSON.parse(localStorage.getItem("tripgpt_users") || "[]");
    const user = users.find((u: any) => u.userId === userId && u.password === password);

    if (!user) {
      toast.error("아이디 또는 비밀번호가 일치하지 않습니다.");
      return;
    }

    // 로그인 성공
    localStorage.setItem("tripgpt_current_user", JSON.stringify(user));
    toast.success(`환영합니다, ${user.username}님!`);
    
    // 입력값 초기화
    setUserId("");
    setPassword("");
    
    // 다이얼로그 닫고 로그인 상태 업데이트
    onOpenChange(false);
    onLoginSuccess(user);
  };

  const handleSignup = () => {
    // 로그인 다이얼로그를 닫고 회원가입 다이얼로그 열기
    onOpenChange(false);
    onSignupClick();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
          <DialogDescription>
            TripGpt에 로그인하여 더 많은 기능을 이용해보세요
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="userId">아이디</Label>
            <Input
              id="userId"
              type="text"
              placeholder="아이디를 입력하세요"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button className="w-full" onClick={handleLogin}>
            로그인
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleSignup}
          >
            <UserPlus className="w-4 h-4" />
            회원가입
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}