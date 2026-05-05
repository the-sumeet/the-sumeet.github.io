document.querySelectorAll('.github-tree-container').forEach(container => {
    const { repo, sha } = container.dataset;
    const listElement = container.querySelector('.tree-list');

    fetch(`https://api.github.com/repos/${repo}/git/trees/${sha}?recursive=1`)
        .then(response => response.json())
        .then(data => {
            if (!data.tree) return;
            
            // Filter out hidden files or git internals if you want
            const html = data.tree
                .filter(file => file.type === "blob") // Only show files, not folders (for simplicity)
                .map(file => {
                    const url = `https://github.com/${repo}/blob/${sha}/${file.path}`;
                    return `<li><a href="${url}" target="_blank">📄 ${file.path}</a></li>`;
                }).join('');
            
            listElement.innerHTML = html;
        })
        .catch(() => {
            listElement.innerHTML = "<li>Error loading files.</li>";
        });
});

(function() {
    const fetchContent = (url, display, header, path) => {
        display.textContent = "Loading content...";
        header.textContent = path;
        
        fetch(url)
            .then(res => res.text())
            .then(text => { display.textContent = text; })
            .catch(() => { display.textContent = "Error loading file."; });
    };

    const initEditor = () => {
        document.querySelectorAll('.github-editor-container').forEach(container => {
            const { repo, sha } = container.dataset;
            const fileList = container.querySelector('.file-list');
            const codeView = container.querySelector('.code-view code');
            const pathHeader = container.querySelector('.file-path-header');

            fetch(`https://api.github.com/repos/${repo}/git/trees/${sha}?recursive=1`)
                .then(res => res.json())
                .then(data => {
                    fileList.innerHTML = data.tree
                        .filter(f => f.type === "blob")
                        .map(f => `<li data-path="${f.path}">📄 ${f.path.split('/').pop()}</li>`)
                        .join('');

                    fileList.querySelectorAll('li').forEach(li => {
                        li.onclick = () => {
                            // GitHub Raw URL for specific commit
                            const rawUrl = `https://raw.githubusercontent.com/${repo}/${sha}/${li.dataset.path}`;
                            
                            fileList.querySelectorAll('li').forEach(el => el.classList.remove('active'));
                            li.classList.add('active');
                            
                            fetchContent(rawUrl, codeView, pathHeader, li.dataset.path);
                        };
                    });
                });
        });
    };

    window.addEventListener('DOMContentLoaded', initEditor);
})();