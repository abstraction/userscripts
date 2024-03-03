// ==UserScript==
// @name          Reddit Styled
// @namespace     https://github.com/abstraction/userscripts
// @description   Old Reddit but a bit more pleasing.
// @author        abstraction
// @version       2024-01-13
// @match         https://old.reddit.com/*/comments/*
// @updateURL     https://raw.githubusercontent.com/abstraction/userscripts/master/src/goto-old-reddit.user.js
// @downloadURL   https://raw.githubusercontent.com/abstraction/userscripts/master/src/goto-old-reddit.user.js
// @icon          https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// ==/UserScript==

(function () {
  "use strict";

  // Utility function to set multiple styles on an element
  const setStyles = (element, styles) => {
    Object.entries(styles).forEach(([key, value]) => {
      element.style[key] = value;
    });
  };

  // Simplified function for removing elements
  const removeElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.remove();
    }
  };

  // Remove unnecessary elements
  removeElement("section.infobar");
  removeElement(".reddit-infobar");
  removeElement(".side");

  // Comments on right
  setStyles(document.querySelector(".content"), {
    display: "flex",
    flexDirection: "row-reverse",
    margin: 0,
  });

  // ok
  setStyles(document.querySelector(".thing"), {
    position: "sticky",
    top: "2rem",
  });

  // ok
  setStyles(document.querySelector("body"), {});

  //   setStyles(
  //     document.querySelector(
  //       ".sitetable > .pinnable-placeholder > .pinnable-content"
  //     ),
  //     {
  //       position: "sticky",
  //       top: "2rem",
  //     }
  //   );

  // Function to handle class changes
  const handleClassChange = (mutationsList) => {
    for (let mutation of mutationsList) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        let element = mutation.target;
        // Check if the specific class is added and take action
        if (element.classList.contains("pinned")) {
          // Remove the class or modify it as needed
          element.classList.remove("pinned");
        }
      }
    }
  };

  // Create an observer instance
  const observer = new MutationObserver(handleClassChange);

  // Observer configuration
  const config = {
    attributes: true,
    subtree: true,
    attributeFilter: ["class"],
  };

  // Start observing the target node for configured mutations
  observer.observe(document.body, config);

  //   document
  //     .querySelector(".sitetable > .pinnable-placeholder > .pinnable-content")
  //     .classList.remove("pinnable-content");

  // Enhance comment appearance
  document.querySelectorAll(".commentarea .md p").forEach((comment) => {
    setStyles(comment, {
      "font-size": "1.2rem",
      "line-height": "1.6",
    });
  });

  // Function to create toggle links for comments
  const createToggleLinks = (parent) => {
    const createLink = (text, action) => {
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = text;
      link.style.marginRight = "10px";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        action(parent);
      });
      return link;
    };

    const toggleChildren = (parent, display, bgColor) => {
      parent.querySelectorAll(".child .comment").forEach((child) => {
        child.querySelector(".md").style.display = display;
        child.style.backgroundColor = bgColor;
      });
    };

    const collapseLink = createLink("Collapse All", (parent) =>
      toggleChildren(parent, "none", "#e6e6e6")
    );
    const expandLink = createLink("Expand All", (parent) =>
      toggleChildren(parent, "", "#f6f6f6")
    );

    return [collapseLink, expandLink];
  };

  // Enhance and add interactivity to comment containers
  document.querySelectorAll(".comment").forEach((container) => {
    setStyles(container, {
      "background-color": "#f6f6f6",
      padding: "10px",
      "border-radius": "5px",
      "margin-bottom": "10px",
    });

    container.addEventListener("click", (event) => {
      const commentBody = container.querySelector(".md");

      if (commentBody) {
        const isVisible = commentBody.style.display !== "none";
        commentBody.style.display = isVisible ? "none" : "";
        container.style.backgroundColor = isVisible ? "#e6e6e6" : "#f6f6f6";
      }
    });

    // Append toggle links
    const [collapseLink, expandLink] = createToggleLinks(container);
    const tagline = container.querySelector(".tagline");
    if (tagline) {
      tagline.appendChild(collapseLink);
      tagline.appendChild(expandLink);
    }
  });

  // Prevent comment collapse when clicking on links within comments
  document.querySelectorAll(".comment a").forEach((link) => {
    link.addEventListener("click", (event) => event.stopPropagation());
  });
})();
