function getUserTheme(): "dark" | "light" {
  if (localStorage.getItem("theme") === "dark") {
    return "dark";
  } else {
    return "light";
  }
}

function setTheme(theme: "dark" | "light") {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.remove("light");
  document.documentElement.classList.add(theme);
}

function toggleTheme() {
  let newTheme: "dark" | "light" = "light";
  if (getUserTheme() === "light") {
    setTheme("dark");
    newTheme = "dark";
  } else {
    setTheme("light");
    newTheme = "light";
  }
  saveUserTheme(newTheme);
  return newTheme;
}

function saveUserTheme(theme: "dark" | "light") {
  localStorage.setItem("theme", theme);
}

export default {
  getUserTheme,
  setTheme,
  toggleTheme,
  saveUserTheme,
};
