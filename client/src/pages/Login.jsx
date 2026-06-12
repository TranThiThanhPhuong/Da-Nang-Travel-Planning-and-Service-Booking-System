import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Sparkles, Map, Shield, TrendingUp } from "lucide-react";

const Login = ({ dbUser }) => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn && dbUser) {
      const role = dbUser.role || "USER";
      if (role === "ADMIN") {
        navigate("/admin");
      } else if (role === "OWNER") {
        navigate("/owner");
      } else {
        navigate("/");
      }
    }
  }, [isSignedIn, dbUser, navigate]);

  const features = [
    {
      icon: <Sparkles size={24} />,
      title: "AI Trip Planner",
      desc: "Lên lịch trình du lịch thông minh với Gemini AI",
      color: "bg-[#FFAB40]/10 text-[#FFAB40]",
    },
    {
      icon: <Map size={24} />,
      title: "Khám phá Đà Nẵng",
      desc: "Hơn 500+ dịch vụ du lịch chất lượng cao",
      color: "bg-[#004D40]/10 text-purple-500",
    },
    {
      icon: <Shield size={24} />,
      title: "Đặt chỗ an toàn",
      desc: "Thanh toán bảo mật, hoàn tiền 100% nếu có sự cố",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: <TrendingUp size={24} />,
      title: "Ưu đãi độc quyền",
      desc: "Giảm giá đến 30% cho thành viên",
      color: "bg-emerald-500/10 text-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-jakarta flex">
      {/* LEFT SIDE - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#004D40] via-[#00332A] to-[#001a14] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFAB40]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#E0F2F1]/5 rounded-full blur-3xl"></div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <h1 className="font-cormorant font-bold text-5xl text-white mb-2">
            D-PULSE
          </h1>
          <p className="text-[#FFAB40] text-sm font-bold uppercase tracking-widest">
            Đà Nẵng Travel Platform
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="relative z-10 space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-cormorant font-bold text-white mb-8"
          >
            Trải nghiệm du lịch{" "}
            <span className="text-[#FFAB40] italic">thông minh</span>
          </motion.h2>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-white/10 backdrop-blur-md p-5 rounded-tr-[24px] rounded-bl-[24px] rounded-tl-xl rounded-br-xl border border-white/20"
              >
                <div
                  className={`w-12 h-12 ${feature.color} rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md flex items-center justify-center mb-3`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-[#E0F2F1]/70 text-xs leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-[#E0F2F1]/50 text-xs relative z-10"
        >
          © 2024 D-Pulse. Nền tảng du lịch thông minh cho Đà Nẵng
        </motion.p>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="font-cormorant font-bold text-4xl text-[#004D40] mb-2">
              D-PULSE
            </h1>
            <p className="text-[#FFAB40] text-xs font-bold uppercase tracking-widest">
              Đăng nhập để tiếp tục
            </p>
          </div>

          {/* Clerk SignIn Component Wrapper */}
          <div className="bg-white/80 backdrop-blur-[10px] p-8 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
            <div className="mb-6">
              <h2 className="text-2xl font-cormorant font-bold text-[#004D40]">
                Chào mừng trở lại!
              </h2>
              <p className="text-sm text-[#004D40]/60 mt-2">
                Đăng nhập để trải nghiệm đầy đủ tính năng của D-Pulse
              </p>
            </div>

            <SignIn
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
              signUpUrl="/sign-up"
            />
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-[#004D40]/60">
              Bằng cách đăng nhập, bạn đồng ý với{" "}
              <a href="#" className="text-[#FFAB40] font-bold hover:underline">
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="#" className="text-[#FFAB40] font-bold hover:underline">
                Chính sách bảo mật
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
