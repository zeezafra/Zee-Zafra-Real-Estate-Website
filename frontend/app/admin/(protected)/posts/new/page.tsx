import PostForm from "../PostForm";

export default function NewPostPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-navy">New Post</h1>
      <p className="mt-1 text-sm text-navy/60">
        Write the article below. Uncheck &ldquo;Published&rdquo; to save it as a draft.
      </p>
      <div className="mt-8">
        <PostForm apiUrl={apiUrl} />
      </div>
    </main>
  );
}
