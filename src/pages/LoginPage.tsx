import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Box, Key, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import ToastContainer from "../components/common/ToastContainer";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, loginWithRecovery } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const success = login(username.trim(), password);
      if (success) {
        showToast("مرحباً بك! تم تسجيل الدخول بنجاح", "success");
        navigate("/dashboard");
      } else {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      }
      setLoading(false);
    }, 500);
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = loginWithRecovery(recoveryKey.trim());
    if (success) {
      showToast("تم تسجيل الدخول عبر مفتاح الاسترداد", "success");
      navigate("/dashboard");
    } else {
      setError("مفتاح الاسترداد غير صحيح");
    }
  };

  return (
    <div className="min-h-screen bg-[#e8ecf0] flex flex-col items-center justify-center p-4 relative">
      <ToastContainer />

      {/* Logo */}
      <div className="mb-6">
        <div className="w-20 h-20 bg-[#2d5a8e] rounded-2xl flex items-center justify-center shadow-xl">
          <Box className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-[#1e3a5f] tracking-wide uppercase">
            A-E STORAGE
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            أدخل بياناتك لإدارة النظام الخاص بك
          </p>
        </div>

        {!showRecovery ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم"
                dir="rtl"
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-right text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#2d5a8e] focus:ring-2 focus:ring-[#2d5a8e]/20 transition-all bg-gray-50"
              />
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                dir="rtl"
                className="w-full px-4 py-3 pr-11 pl-11 border border-gray-200 rounded-xl text-right text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#2d5a8e] focus:ring-2 focus:ring-[#2d5a8e]/20 transition-all bg-gray-50"
              />
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg text-right">
                {error}
              </div>
            )}

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setShowRecovery(true);
                  setError("");
                }}
                className="text-sm text-[#2d5a8e] font-semibold hover:underline"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-70 text-base shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRecovery} className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-sm font-semibold text-gray-700">
                استرداد كلمة المرور
              </p>
              <p className="text-xs text-gray-500 mt-1">
                أدخل مفتاح الاسترداد للوصول إلى النظام
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                placeholder="مفتاح الاسترداد"
                dir="rtl"
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-right text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#2d5a8e] focus:ring-2 focus:ring-[#2d5a8e]/20 transition-all bg-gray-50"
              />
              <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg text-right">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-bold rounded-xl transition-all"
            >
              تحقق من المفتاح
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRecovery(false);
                setError("");
              }}
              className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              ← العودة لتسجيل الدخول
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 font-bold">
          تم التطوير بواسطة:
          <span className="text-[#2d5a8e]">Ahmed Mohamed </span>&
          <span className="text-[#2d5a8e]"> Abdallah Elshemy</span>
        </p>

        <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
          <span>📞</span>
          <span>01102346158</span>
          <span className="mx-2">•</span>
          <span>📞</span>
          <span>01070495013</span>
        </p>

        <p className="text-xs text-gray-400 mt-2">
          © A-E Storage Ecosystem 2025 جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
