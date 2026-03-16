
-- Allow admins to delete any post
CREATE POLICY "Admins can delete any post" ON public.posts
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any like (for cascading post deletes)
CREATE POLICY "Admins can delete any like" ON public.likes
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any save
CREATE POLICY "Admins can delete any save" ON public.saves
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete notifications
CREATE POLICY "Admins can delete notifications" ON public.notifications
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
