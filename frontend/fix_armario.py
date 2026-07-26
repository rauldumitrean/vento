import re
with open('src/components/ArmarioHistorial.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'", "'bg-black/20 border-white/10 backdrop-blur-xl'")
code = code.replace("darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'", "'bg-black/20 border-white/10 backdrop-blur-xl'")
code = code.replace("darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'", "'bg-black/40 border-white/10 text-white'")
code = code.replace("darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'", "'bg-black/40 border-white/10 text-white placeholder-gray-500'")
code = code.replace("bg-indigo-900/30", "bg-white/10")
code = code.replace("bg-gray-700", "bg-white/10")
code = code.replace("bg-indigo-500/20", "bg-indigo-500/30")

with open('src/components/ArmarioHistorial.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
