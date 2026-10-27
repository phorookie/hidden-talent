-- 隐藏天赋实验室 · 密码库（在 Supabase SQL Editor 中执行一次）
-- 表 1：密码与剩余次数
-- 先清理可能残留的旧表（含旧列名 left），再干净重建
drop table if exists passwords;
drop table if exists meta;

create table if not exists passwords (
  code text primary key,
  remaining int not null default 3,
  max  int not null default 3,
  note text default ''
);

-- 表 2：后台管理密钥（key='master'）
create table if not exists meta (
  key   text primary key,
  value text
);

-- 初始管理密钥（请部署后尽快在后台「修改密钥」改掉）
insert into meta (key, value) values ('master', 'CHANGE_ME_ADMIN')
  on conflict (key) do nothing;

-- 演示密码（各 3 次）
insert into passwords (code, remaining, max, note) values
  ('TALENT2026', 3, 3, '演示'),
  ('HIDDEN888',  3, 3, '演示')
  on conflict (code) do nothing;
