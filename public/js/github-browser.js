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

    // Helper function to turn flat GitHub paths into a nested object
    const buildTree = (items) => {
        const root = { _children: {} };
        items.forEach(item => {
            const parts = item.path.split('/');
            let current = root._children;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = { type: 'tree', _children: {} };
                current = current[parts[i]]._children;
            }
            const name = parts[parts.length - 1];
            current[name] = { ...item, _children: {} };
        });
        return root._children;
    };

    // Helper function to generate HTML from the nested object
    const renderHTML = (tree) => {
        let html = '';
        const keys = Object.keys(tree).sort((a, b) => {
            // Sort folders to the top, files to the bottom
            const aIsFolder = tree[a].type === 'tree';
            const bIsFolder = tree[b].type === 'tree';
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a.localeCompare(b);
        });

        keys.forEach(key => {
            const item = tree[key];
            if (item.type === 'tree') {
                html += `
                    <li class="folder">
                        <div class="folder-name" onclick="this.parentElement.classList.toggle('open')">📁 ${key}</div>
                        <ul>${renderHTML(item._children)}</ul>
                    </li>`;
            } else if (item.type === 'blob') {
                html += `<li class="file" data-path="${item.path}">📄 ${key}</li>`;
            }
        });
        return html;
    };

    const initEditor = () => {
        document.querySelectorAll('.github-editor-container').forEach(container => {
            if (container.dataset.loaded) return;
            
            const { repo, sha } = container.dataset;
            const fileList = container.querySelector('.file-list');
            const codeView = container.querySelector('.code-view code');
            const pathHeader = container.querySelector('.file-path-header');

            fetch(`https://api.github.com/repos/${repo}/git/trees/${sha}?recursive=1`)
                .then(res => res.json())
                .then(data => {
                    if (!data.tree) return;

                    // 1. Build and render the tree
                    const treeData = buildTree(data.tree);
                    fileList.innerHTML = renderHTML(treeData);

                    // 2. Attach click listeners to the actual files
                    fileList.querySelectorAll('li.file').forEach(li => {
                        li.onclick = (e) => {
                            e.stopPropagation(); // Prevent clicks from bubbling up to folders
                            const rawUrl = `https://raw.githubusercontent.com/${repo}/${sha}/${li.dataset.path}`;
                            
                            fileList.querySelectorAll('li.file').forEach(el => el.classList.remove('active'));
                            li.classList.add('active');
                            
                            fetchContent(rawUrl, codeView, pathHeader, li.dataset.path);
                        };
                    });
                    
                    // Auto-select the first file and open its parent folders
                    const firstFile = fileList.querySelector('li.file');
                    if (firstFile) {
                        let node = firstFile.parentElement;
                        while (node && node !== fileList) {
                            if (node.classList.contains('folder')) node.classList.add('open');
                            node = node.parentElement;
                        }
                        firstFile.click();
                    }

                    container.dataset.loaded = true;
                });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEditor);
    } else {
        initEditor();
    }
})();