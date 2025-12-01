import fs from "fs";
import path from "path";

const postsPath = path.join(process.cwd(), "data/jagdbuch/posts.json");
const commentsPath = path.join(process.cwd(), "data/jagdbuch/comments.json");

export function getAllPosts() {
  return JSON.parse(fs.readFileSync(postsPath, "utf8"));
}

export function getPostBySlug(slug) {
  const posts = getAllPosts();
  return posts.find(p => p.slug === slug);
}

export function addPost(post) {
  const posts = getAllPosts();
  posts.unshift(post);
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  return post;
}

export function getComments(slug) {
  const all = JSON.parse(fs.readFileSync(commentsPath, "utf8"));
  return all.filter(c => c.slug === slug);
}

export function addComment(newComment) {
  const all = JSON.parse(fs.readFileSync(commentsPath, "utf8"));
  all.push(newComment);
  fs.writeFileSync(commentsPath, JSON.stringify(all, null, 2));
  return newComment;
}
