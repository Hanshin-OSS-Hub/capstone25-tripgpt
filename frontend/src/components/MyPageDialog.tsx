import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { User, Mail, Lock, Tag, Save, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface MyPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  onUserUpdate: (updatedUser: any) => void;
}

// 카테고리별 세부 키워드
const categoryTags = {
  자연: ["바다", "산", "폭포", "동굴", "섬", "계곡", "캠핑"],
  랜드마크: ["타워", "궁궐", "성당", "다리"],
  액티비티: ["놀이공원", "테마파크", "레저", "체험"],
  스포츠: ["야구", "축구", "농구", "배구", "골프", "볼링", "야구장", "축구장", "배구장", "체육관"],
  맛집: ["시장", "먹거리거리", "카페거리", "해산물", "중식", "일식", "양식", "한식", "디저트"],
  이벤트: ["축제", "연극", "뮤지컬", "전시", "팝업"],
  핫플: ["포토존", "야경", "버스킹"],
  역사: ["전통문화", "사찰", "유적", "박물관"]
};

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, string> = {
  자연: "🌊",
  랜드마크: "🏛️",
  액티비티: "🎢",
  스포츠: "⚽",
  맛집: "🍜",
  이벤트: "🎉",
  핫플: "📸",
  역사: "🏯"
};

export function MyPageDialog({ open, onOpenChange, currentUser, onUserUpdate }: MyPageDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredKeywords, setPreferredKeywords] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "keywords">("profile");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser && open) {
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      setPassword("");
      setConfirmPassword("");
      
      // 로컬 스토리지에서 사용자의 선호 키워드 불러오기
      const savedKeywords = localStorage.getItem(`tripgpt_keywords_${currentUser.email}`);
      if (savedKeywords) {
        setPreferredKeywords(JSON.parse(savedKeywords));
      } else {
        setPreferredKeywords([]);
      }
    }
  }, [currentUser, open]);

  const toggleKeyword = (keyword: string) => {
    if (preferredKeywords.includes(keyword)) {
      setPreferredKeywords(preferredKeywords.filter((k) => k !== keyword));
    } else {
      setPreferredKeywords([...preferredKeywords, keyword]);
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setPreferredKeywords(preferredKeywords.filter(k => k !== keywordToRemove));
  };

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  const handleSaveProfile = () => {
    if (!username.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    if (!email.trim()) {
      toast.error("이메일을 입력해주세요.");
      return;
    }

    // 비밀번호 변경하는 경우
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        toast.error("비밀번호가 일치하지 않습니다.");
        return;
      }

      if (password.length < 4) {
        toast.error("비밀번호는 최소 4자 이상이어야 합니다.");
        return;
      }
    }

    // 사용자 정보 업데이트
    const users = JSON.parse(localStorage.getItem("tripgpt_users") || "[]");
    const userIndex = users.findIndex((u: any) => u.email === currentUser.email);

    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        username,
        email,
        ...(password ? { password } : {}),
      };

      localStorage.setItem("tripgpt_users", JSON.stringify(users));
      localStorage.setItem("tripgpt_current_user", JSON.stringify(users[userIndex]));
      onUserUpdate(users[userIndex]);
      toast.success("회원정보가 수정되었습니다.");
    }
  };

  const handleSaveKeywords = () => {
    // 선호 키워드 저장
    localStorage.setItem(`tripgpt_keywords_${currentUser.email}`, JSON.stringify(preferredKeywords));
    
    // 현재 사용자 정보에도 추가
    const updatedUser = {
      ...currentUser,
      preferredKeywords,
    };
    localStorage.setItem("tripgpt_current_user", JSON.stringify(updatedUser));
    onUserUpdate(updatedUser);
    
    toast.success(`선호 키워드 ${preferredKeywords.length}개가 저장되었습니다.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <User className="w-6 h-6" />
              마이페이지
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              회원정보를 수정하고 선호 키워드를 설정하세요
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-center transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <User className="w-5 h-5 inline-block mr-2" />
            회원정보 수정
          </button>
          <button
            onClick={() => setActiveTab("keywords")}
            className={`flex-1 py-3 text-center transition-colors ${
              activeTab === "keywords"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Tag className="w-5 h-5 inline-block mr-2" />
            선호 키워드 설정
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(85vh - 200px)" }}>
          {activeTab === "profile" ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-sm text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  이름
                </label>
                <Input
                  type="text"
                  placeholder="이름 입력"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  이메일
                </label>
                <Input
                  type="email"
                  placeholder="이메일 입력"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-600 mb-3">비밀번호를 변경하려면 아래 필드를 입력하세요</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      새 비밀번호
                    </label>
                    <Input
                      type="password"
                      placeholder="새 비밀번호 (변경 시에만 입력)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      새 비밀번호 확인
                    </label>
                    <Input
                      type="password"
                      placeholder="새 비밀번호 확인"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
              >
                <Save className="w-4 h-4" />
                회원정보 저장
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-blue-900 mb-2 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  선호 키워드란?
                </h3>
                <p className="text-sm text-blue-700">
                  미리 선호하는 키워드를 설정하면, 지역을 검색할 때 해당 키워드에 맞는 관광지가 자동으로 우선 표시됩니다.
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  현재 <strong>{preferredKeywords.length}개</strong>의 키워드가 선택되었습니다.
                </p>
              </div>

              {/* 선택된 키워드 표시 */}
              {preferredKeywords.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-1.5 w-full mb-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      선택된 키워드
                    </span>
                    <AnimatePresence>
                      {preferredKeywords.map((kw) => (
                        <motion.div
                          key={kw}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-sm"
                        >
                          <span>{kw}</span>
                          <button
                            onClick={() => handleRemoveKeyword(kw)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* 카테고리 선택 UI */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">카테고리</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                </div>
                
                {/* 카테고리 버튼들을 가로로 배치 */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryTags).map(([category, tags]) => {
                    const isExpanded = expandedCategories.includes(category);
                    return (
                      <motion.button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all shadow-sm ${
                          isExpanded
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                            : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 hover:from-gray-200 hover:to-gray-100"
                        }`}
                      >
                        <span className="mr-1">{categoryIcons[category]}</span>
                        {category}
                      </motion.button>
                    );
                  })}
                </div>

                {/* 펼쳐진 카테고리의 키워드들 */}
                <AnimatePresence>
                  {expandedCategories.map((category) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-blue-700">
                            {categoryIcons[category]} {category}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categoryTags[category as keyof typeof categoryTags].map((tag) => {
                            const isSelected = preferredKeywords.includes(tag);
                            return (
                              <motion.button
                                key={tag}
                                onClick={() => toggleKeyword(tag)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                                  isSelected
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                                    : "bg-white text-blue-700 hover:bg-blue-100 border border-blue-200"
                                }`}
                              >
                                {tag}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                onClick={handleSaveKeywords}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
              >
                <Save className="w-4 h-4" />
                선호 키워드 저장
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
