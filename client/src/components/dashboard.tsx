"use client";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useMemo, useState, useEffect } from "react";
import userPosts from "@/hooks/useUserPosts";
import { useSession } from "next-auth/react";
import { PostType } from "@/typings/types";
import { useRouter } from "next/navigation";
import useDeletePost from "@/hooks/useDeletePost";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PostsTabContent from "./posts-tab-component";
import { PostPerformance } from "./post-performance";
import { Analytics } from "./analytics";
import { DashboardNav } from "./dashboard-nav";
import { useTranslations } from "next-intl";

export function Dashboard() {
  const [postStatus, setPostStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<PostType | null>(null);
  const { data: user } = useSession();
  const { deletePost, status } = useDeletePost();
  const router = useRouter();
  const tDashboard = useTranslations("dashboard");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (
        hash === "performance" ||
        hash === "analytics" ||
        hash === "dashboard"
      ) {
        setActiveTab(hash);
      } else if (hash === "") {
        setActiveTab("dashboard");
      }
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newHash = tab === "dashboard" ? "" : `#${tab}`;
    window.history.replaceState(null, "", window.location.pathname + newHash);
  };

  const { blogPosts, arePostsFetching, arePostsLoading } = userPosts(
    user?.user?.id || ""
  );

  function handleDeletePost(post: PostType) {
    setPostToDelete(post);
    setIsDeleteDialogOpen(true);
  }

  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post: PostType) => {
      if (postStatus === "all") return true;
      if (postStatus === "published") return post.status === "published";
      if (postStatus === "unpublished") return post.status === "unpublished";
      if (postStatus === "draft") return post.status === "draft";
      return true;
    });
  }, [blogPosts, postStatus]);

  const handleEditPost = useCallback(
    (slug: string) => {
      router.push(`/edit-post/${slug}`);
    },
    [router]
  );

  function handleNewPost() {
    router.push("/new");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 pt-16 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="fixed top-16 bottom-0 left-0 hidden w-14 flex-col border-r bg-background sm:flex z-30">
        <DashboardNav activeTab={activeTab} handleTabChange={handleTabChange} />
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t flex justify-around items-center h-14">
        <DashboardNav
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          isMobile
        />
      </nav>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 pb-14 sm:pb-0 min-w-0">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 min-w-0 overflow-x-hidden">
          {activeTab === "dashboard" && (
            <Tabs defaultValue="all" className="w-full min-w-0">
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-0">
                <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:flex sm:flex-wrap">
                  <TabsTrigger
                    value="all"
                    onClick={() => setPostStatus("all")}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    {tDashboard("tabs.all")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="published"
                    onClick={() => setPostStatus("published")}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    {tDashboard("tabs.published")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="unpublished"
                    onClick={() => setPostStatus("unpublished")}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    {tDashboard("tabs.unpublished")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="draft"
                    onClick={() => setPostStatus("draft")}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    {tDashboard("tabs.draft")}
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center justify-center sm:ml-auto gap-2">
                  <Button
                    size="sm"
                    className="h-8 gap-1 text-xs sm:text-sm px-2 sm:px-3"
                    onClick={handleNewPost}
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sm:hidden">
                      {tDashboard("actions.newPost")}
                    </span>
                    <span className="hidden sm:inline sr-only sm:not-sr-only sm:whitespace-nowrap">
                      {tDashboard("actions.addNewPost")}
                    </span>
                  </Button>
                </div>
              </div>
              <TabsContent value="all" className="w-full min-w-0">
                <PostsTabContent
                  filteredPosts={filteredPosts}
                  arePostsFetching={arePostsFetching}
                  arePostsLoading={arePostsLoading}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                  status={status}
                />
              </TabsContent>
              <TabsContent value="published" className="w-full min-w-0">
                <PostsTabContent
                  filteredPosts={filteredPosts}
                  arePostsFetching={arePostsFetching}
                  arePostsLoading={arePostsLoading}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                  status={status}
                />
              </TabsContent>
              <TabsContent value="unpublished" className="w-full min-w-0">
                <PostsTabContent
                  filteredPosts={filteredPosts}
                  arePostsFetching={arePostsFetching}
                  arePostsLoading={arePostsLoading}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                  status={status}
                />
              </TabsContent>
              <TabsContent value="draft" className="w-full min-w-0">
                <PostsTabContent
                  filteredPosts={filteredPosts}
                  arePostsFetching={arePostsFetching}
                  arePostsLoading={arePostsLoading}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                  status={status}
                />
              </TabsContent>
            </Tabs>
          )}
          {activeTab === "performance" && (
            <div className="w-full max-w-full overflow-x-auto min-w-0">
              <PostPerformance blogPosts={blogPosts} />
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="w-full max-w-full overflow-x-auto min-w-0">
              <Analytics blogPosts={blogPosts} />
            </div>
          )}
        </main>
      </div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-background border-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tDashboard("deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tDashboard("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {tDashboard("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && deletePost(postToDelete)}
              className="bg-destructive text-foreground hover:bg-destructive hover:opacity-90"
            >
              {tDashboard("deleteDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
