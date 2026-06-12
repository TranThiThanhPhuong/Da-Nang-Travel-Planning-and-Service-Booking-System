import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignUp, useUser, useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Sparkles, Users, Award, Zap } from "lucide-react";
import { useAuthSync } from "../hooks/useAuthSync";

const SignUpPage = () => {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { dbUser } = useAuthSync();

  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user) {
        try {
          const token = await getToken();
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/auth/sync`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`, // Gửi token để Backend verify
              },
              body: JSON.stringify({ clerkId: user.id }),
            },
          );

          if (response.ok) {
            console.log("✅ Đồng bộ User thành công");
            navigate("/");
          }
        } catch (error) {
          console.error("❌ Lỗi đồng bộ User:", error);
        }
      }
    };

    syncUser();
  }, [isSignedIn, user, navigate, getToken]);

  useEffect(() => {
    if (isSignedIn && dbUser) {
      if (dbUser.role === "ADMIN") {
        navigate("/admin");
      } else if (dbUser.role === "OWNER") {
        navigate("/owner");
      } else {
        navigate("/");
      }
    }
  }, [isSignedIn, dbUser, navigate]);

  const benefits = [
    {
      icon: <Sparkles size={20} />,
      title: "AI Trip Planner miễn phí",
      color: "bg-[#FFAB40]/10 text-[#FFAB40]",
    },
    {
      icon: <Users size={20} />,
      title: "Ưu đãi thành viên độc quyền",
      color: "bg-[#004D40]/10 text-black",
    },
    {
      icon: <Award size={20} />,
      title: "Tích điểm đổi quà",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: <Zap size={20} />,
      title: "Đặt chỗ nhanh chóng",
      color: "bg-emerald-500/10 text-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-jakarta flex">
      {/* LEFT - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#004D40] via-[#00332A] to-[#001a14] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFAB40]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#E0F2F1]/5 rounded-full blur-3xl"></div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <h1 className="font-cormorant font-bold text-5xl text-white mb-2">
            D-PULSE
          </h1>
          <p className="text-[#FFAB40] text-sm font-bold uppercase tracking-widest">
            Tham gia cộng đồng du lịch
          </p>
        </motion.div>

        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-cormorant font-bold text-white mb-8"
          >
            Quyền lợi khi <span className="text-[#FFAB40] italic">đăng ký</span>
          </motion.h2>

          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-tr-[20px] rounded-bl-[20px] rounded-tl-lg rounded-br-lg border border-white/20"
              >
                <div
                  className={`w-10 h-10 ${benefit.color} rounded-tr-lg rounded-bl-lg rounded-tl-md rounded-br-md flex items-center justify-center shrink-0`}
                >
                  {benefit.icon}
                </div>
                <p className="text-white font-bold text-sm">{benefit.title}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-[#E0F2F1]/50 text-xs relative z-10"
        >
          Hơn 10,000+ du khách đã tin tưởng D-Pulse
        </motion.p>
      </div>

      {/* RIGHT - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 text-center">
            <h1 className="font-cormorant font-bold text-4xl text-[#004D40] mb-2">
              D-PULSE
            </h1>
            <p className="text-[#FFAB40] text-xs font-bold uppercase tracking-widest">
              Tạo tài khoản mới
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-[10px] p-8 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
            <div className="mb-6">
              <h2 className="text-2xl font-cormorant font-bold text-[#004D40]">
                Bắt đầu hành trình!
              </h2>
              <p className="text-sm text-[#004D40]/60 mt-2">
                Tạo tài khoản để khám phá Đà Nẵng cùng D-Pulse
              </p>
            </div>

            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "bg-white border border-[#E0F2F1] hover:bg-[#E0F2F1] text-[#004D40] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md",
                  socialButtonsBlockButtonText: "font-bold text-sm",
                  dividerLine: "bg-[#E0F2F1]",
                  dividerText: "text-[#004D40]/60 text-xs font-medium",
                  formFieldInput:
                    "bg-white border-[#E0F2F1] focus:border-[#004D40] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md text-[#004D40]",
                  formFieldLabel: "text-[#004D40] font-bold text-xs",
                  formButtonPrimary:
                    "bg-[#004D40] hover:bg-[#00332A] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md font-bold shadow-lg shadow-[#004D40]/20",
                  footerActionLink: "text-[#FFAB40] hover:text-[#e09635]",
                  identityPreviewText: "text-[#004D40]",
                  formResendCodeLink: "text-[#FFAB40]",
                },
              }}
              forceRedirectUrl="/auth-callback"
              signInUrl="/login"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-[#004D40]/60">
              Đã có tài khoản?{" "}
              <a
                href="/login"
                className="text-[#FFAB40] font-bold hover:underline"
              >
                Đăng nhập ngay
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;
