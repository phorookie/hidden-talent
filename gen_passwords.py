import random

# 去除手机端易混字符：0 O 1 I L
charset = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
prefix = "HT"
N = 100

def gen():
    return prefix + "".join(random.choices(charset, k=6))

codes = set()
while len(codes) < N:
    codes.add(gen())
codes = sorted(codes)

# 1) Supabase 批量导入 SQL
with open("supabase/seed_passwords_100.sql", "w", encoding="utf-8") as f:
    f.write("-- 批量导入 100 个测试密码（每个可测 3 次）。在 Supabase SQL Editor 执行一次即可。\n")
    f.write("-- 重复执行不会覆盖已有密码（on conflict do nothing）；如需重置次数用 admin.html 的「重置」。\n\n")
    f.write("insert into passwords (code, remaining, max, note) values\n")
    rows = ",\n".join(f"  ('{c}', 3, 3, '小红书')" for c in codes)
    f.write(rows + "\n")
    f.write("on conflict (code) do nothing;\n")

# 2) 分发清单（纯文本，便于复制给客户 / 做卡密）
with open("密码清单_100.txt", "w", encoding="utf-8") as f:
    f.write(f"隐藏天赋实验室 · 测试密码清单（共 {N} 个，每个可测 3 次）\n")
    f.write("=" * 44 + "\n")
    for i, c in enumerate(codes, 1):
        f.write(f"{i:03d}. {c}\n")

print(f"已生成 {len(codes)} 个密码，示例：{codes[0]} ... {codes[-1]}")
print("文件：supabase/seed_passwords_100.sql  /  密码清单_100.txt")
