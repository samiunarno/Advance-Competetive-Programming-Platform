-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  role text default 'user',
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Trigger to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, role, email)
  values (
    new.id, 
    new.raw_user_meta_data->>'username', 
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. PROBLEMS TABLE
create table public.problems (
  id serial primary key,
  title text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  description text not null,
  input_format text,
  output_format text,
  sample_input text,
  sample_output text,
  deadline timestamp with time zone,
  daily_submission_limit integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.problems enable row level security;

create policy "Problems are viewable by everyone." on public.problems
  for select using (true);

create policy "Admins can insert problems." on public.problems
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update problems." on public.problems
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete problems." on public.problems
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Initial Data for Problems
insert into public.problems (title, difficulty, description, input_format, output_format, sample_input, sample_output) values
('Two Sum', 'Easy', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 'Array of integers and a target integer', 'Indices of the two numbers', '[2,7,11,15], 9', '[0,1]'),
('Reverse Linked List', 'Easy', 'Given the head of a singly linked list, reverse the list, and return the reversed list.', 'Head of a linked list', 'Reversed linked list', '[1,2,3,4,5]', '[5,4,3,2,1]'),
('Longest Substring Without Repeating Characters', 'Medium', 'Given a string s, find the length of the longest substring without repeating characters.', 'A string s', 'Length of longest substring', 'abcabcbb', '3'),
('Median of Two Sorted Arrays', 'Hard', 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.', 'Two sorted arrays', 'Median value', '[1,3], [2]', '2.0');


-- 3. SUBMISSIONS TABLE
create table public.submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  problem_id integer references public.problems(id) on delete cascade not null,
  code text not null,
  language text not null,
  verdict text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.submissions enable row level security;

create policy "Users can view their own submissions." on public.submissions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own submissions." on public.submissions
  for insert with check (auth.uid() = user_id);
