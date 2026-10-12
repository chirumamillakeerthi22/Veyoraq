"use client";

import { useEffect } from "react";

/*
  The Back / Continue controls of a quiz.

  On phones the bar is genuinely fixed just above the bottom navigation, so it
  stays put however far the page is scrolled. (A `sticky` bar inside the quiz
  container was pushed up and off the screen once the container's end came into
  view.)

  Because the bar is fixed, the page needs extra room at its very end so the last
  lines of the footer are not hidden behind it. The room is added to the end of the
  document (see body.has-quiz-bar in globals.css) while a quiz is on screen. From md
  up it is an ordinary row in the page.
*/
export function QuizActions({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("has-quiz-bar");
    return () => document.body.classList.remove("has-quiz-bar");
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-sand bg-ivory md:static md:z-auto md:mt-8 md:border-0 md:bg-transparent">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3 sm:px-8 md:px-0 md:py-0">
        {children}
      </div>
    </div>
  );
}
