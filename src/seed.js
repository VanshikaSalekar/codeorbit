module.exports = q => {
  const T = (title, summary, url, cat, tags) => q.save('tool', { title, summary, url, cat, tags });
  T('Regex101', 'Write and explain regular expressions with live match highlighting.', 'https://regex101.com', 'Testing', 'regex,strings');
  T('JSON Crack', 'Turn a wall of JSON into a graph you can actually read.', 'https://jsoncrack.com', 'Data', 'json,data');
  T('Excalidraw', 'A whiteboard that makes architecture sketches look friendly.', 'https://excalidraw.com', 'Design', 'diagrams,design');
  T('Can I use', 'Check browser support for any web feature before you ship it.', 'https://caniuse.com', 'Web', 'css,browsers');
  T('Bundlephobia', 'See what an npm package costs your bundle before installing.', 'https://bundlephobia.com', 'Web', 'npm,performance');
  const S = (title, summary, lang, body, tags) => q.save('snippet', { title, summary, lang, body, tags });
  S('Debounce a function', 'Wait until typing stops before firing work.', 'JS', 'const debounce = (fn, ms = 300) => {\n  let id;\n  return (...args) => {\n    clearTimeout(id);\n    id = setTimeout(() => fn(...args), ms);\n  };\n};', 'javascript,performance');
  S('Center anything', 'Two lines. No margin hacks.', 'CSS', '.center {\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n}', 'css,layout');
  S('Undo last commit', 'Keeps your changes staged so you can fix and recommit.', 'GIT', 'git reset --soft HEAD~1', 'git,terminal');
  q.save('meme', { title: 'Recursion', summary: 'A function that calls itself, and why it needs a way out.', tags: 'python,javascript',
    body: 'Every recursive function needs a base case, the condition that stops the calls. Without one, the call stack fills up and the program crashes.',
    extra: 'f()|Calls itself\nf(f())|Calls itself again\n💥|Stack overflow' });
  q.save('meme', { title: 'Git branches', summary: 'Cheap pointers that let you experiment safely.', tags: 'git',
    body: 'A branch is a movable pointer to a commit. Branching costs almost nothing, so you can try ideas without touching stable code.',
    extra: 'main|Stable\nfeat|Experiment freely\nPR|Merge with review' });
  q.save('post', { title: 'Stop writing regex you cannot read', summary: 'Named groups and comments make patterns maintainable.', tags: 'regex,strings',
    body: 'A regular expression is code, so it deserves the same care as any function. Yet most of us paste a cryptic line and hope nobody touches it again.\nStart with named groups. Instead of counting parentheses, write a group with a name and read it from the match. The intent lives in the pattern itself.\nThen test with real input. A tool like Regex101 shows every match live, which turns guessing into checking.' });
  q.save('post', { title: 'The CSS grid trick that replaced my media queries', summary: 'auto-fill and minmax give you responsive columns for free.', tags: 'css,layout',
    body: 'Most card layouts do not need breakpoints. They need a rule about how small a card may get.\nUse repeat(auto-fill, minmax(260px, 1fr)). The browser fits as many columns as it can and stretches them evenly.\nKeep media queries for real layout changes, such as moving a sidebar.' });
};
