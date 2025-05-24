document.addEventListener("DOMContentLoaded", function() {
  // Grab all the elements we'll need
  var form = document.getElementById("username-form");
  var input = document.getElementById("username-input");
  var loading = document.getElementById("loading");
  var error = document.getElementById("error");
  var results = document.getElementById("results");
  var profileSection = document.getElementById("profile-section");
  var topicsList = document.getElementById("topics-list");
  var problemsList = document.getElementById("problems-list");
  var resourcesList = document.getElementById("resources-list");
  var calendarContainer = document.getElementById("submission-calendar");

  // Check if everything loaded
  if (!form || !input || !loading || !error || !results || !profileSection || !topicsList || !problemsList || !resourcesList || !calendarContainer) {
    console.log("Error: Some elements are missing!");
    error.innerHTML = "Page didn't load correctly. Try refreshing.";
    error.classList.remove("hidden");
    return;
  }

  // Default data if API fails
  var defaultData = {
    profile: { username: "N/A", ranking: "N/A", totalSolved: 0 },
    topicCoverage: [{ topic: "General", coverage: 0 }],
    weakTopics: [{ topic: "General", description: "Couldn't fetch data. Try again later." }],
    recommendedProblems: [{ title: "Explore Problems", url: "https://leetcode.com/problemset/" }],
    resources: [{ topic: "General Coding", url: "https://www.geeksforgeeks.org/" }],
    submissionCalendar: {}
  };

  var topicChart = null;

  // Create the particle falling effect
  function setupParticles() {
    var layer1 = document.getElementById("parallax-layer-1");
    var layer2 = document.getElementById("parallax-layer-2");
    var layer3 = document.getElementById("parallax-layer-3");

    if (!layer1 || !layer2 || !layer3) {
      console.log("Parallax layers not found. Skipping particles.");
      return;
    }

    var particleCount = 150;

    // Layer 1 - Fast falling particles
    for (var i = 0; i < particleCount; i++) {
      var particle = document.createElement("div");
      particle.classList.add("particle");
      particle.style.left = Math.random() * 100 + "vw";
      // Start particles at random heights between -150vh and 150vh for continuous falling
      particle.style.top = (Math.random() * 300 - 150) + "vh";
      particle.style.width = (Math.random() * 2 + 2) + "px";
      particle.style.height = particle.style.width;
      particle.style.animationDuration = (Math.random() * 5 + 5) + "s"; // 5-10s
      // Minimize delay to ensure immediate falling
      particle.style.animationDelay = (Math.random() * 1) + "s"; // 0-1s
      particle.classList.add("layer-1");
      layer1.appendChild(particle);
    }

    // Layer 2 - Medium speed particles
    for (var i = 0; i < particleCount / 1.5; i++) {
      var particle = document.createElement("div");
      particle.classList.add("particle");
      particle.style.left = Math.random() * 100 + "vw";
      particle.style.top = (Math.random() * 300 - 150) + "vh";
      particle.style.width = (Math.random() * 1.5 + 1.5) + "px";
      particle.style.height = particle.style.width;
      particle.style.animationDuration = (Math.random() * 10 + 10) + "s"; // 10-20s
      particle.style.animationDelay = (Math.random() * 1) + "s"; // 0-1s
      particle.classList.add("layer-2");
      layer2.appendChild(particle);
    }

    // Layer 3 - Slow particles with glow
    for (var i = 0; i < particleCount / 2; i++) {
      var particle = document.createElement("div");
      particle.classList.add("particle");
      particle.style.left = Math.random() * 100 + "vw";
      particle.style.top = (Math.random() * 300 - 150) + "vh";
      particle.style.width = (Math.random() * 1 + 1) + "px";
      particle.style.height = particle.style.width;
      particle.style.animationDuration = (Math.random() * 15 + 15) + "s"; // 15-30s
      particle.style.animationDelay = (Math.random() * 1) + "s"; // 0-1s
      particle.classList.add("layer-3");
      layer3.appendChild(particle);
    }
  }

  // Parallax effect on mouse move
  document.addEventListener("mousemove", function(e) {
    var layer1 = document.getElementById("parallax-layer-1");
    var layer2 = document.getElementById("parallax-layer-2");
    var layer3 = document.getElementById("parallax-layer-3");

    if (!layer1 || !layer2 || !layer3) return;

    var x = (window.innerWidth / 2 - e.clientX) / 50;
    var y = (window.innerHeight / 2 - e.clientY) / 50;
    layer1.style.transform = "translate(" + x + "px, " + y + "px)";
    layer2.style.transform = "translate(" + (x / 1.5) + "px, " + (y / 1.5) + "px)";
    layer3.style.transform = "translate(" + (x / 2) + "px, " + (y / 2) + "px)";
  });

  setupParticles();

  // Form submission handler
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var username = input.value.trim();
    if (!username) return;

    error.classList.add("hidden");
    results.classList.add("hidden");
    loading.classList.remove("hidden");
    profileSection.innerHTML = "";
    topicsList.innerHTML = "";
    problemsList.innerHTML = "";
    resourcesList.innerHTML = "";
    calendarContainer.innerHTML = "";

    // Fetch user data and calendar data
    var userDataPromise = fetchUserData(username);
    var calendarDataPromise = fetchCalendarData(username);

    Promise.all([userDataPromise, calendarDataPromise])
      .then(function(values) {
        var userData = values[0];
        var calendarData = values[1];
        return processData(userData, calendarData);
      })
      .then(function(data) {
        showResults(data);
        loading.classList.add("hidden");
      })
      .catch(function(err) {
        showError(err, username);
        loading.classList.add("hidden");
      });
  });

  function fetchUserData(username) {
    return fetch("/api/leetcode/" + encodeURIComponent(username))
      .then(function(response) {
        if (!response.ok) {
          if (response.status === 404) throw new Error("User not found");
          if (response.status === 429) throw new Error("Too many requests (429). Please try again later.");
          throw new Error("HTTP error " + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        console.log("API Response (Stats):", JSON.stringify(data, null, 2));
        if (data.errors || !data.data.matchedUser) throw new Error("User not found");

        var tagCounts = {};
        var advanced = data.data.matchedUser.tagProblemCounts.advanced;
        var intermediate = data.data.matchedUser.tagProblemCounts.intermediate;
        var fundamental = data.data.matchedUser.tagProblemCounts.fundamental;

        for (var i = 0; i < advanced.length; i++) {
          tagCounts[advanced[i].tagName] = advanced[i].problemsSolved;
        }
        for (var i = 0; i < intermediate.length; i++) {
          tagCounts[intermediate[i].tagName] = intermediate[i].problemsSolved;
        }
        for (var i = 0; i < fundamental.length; i++) {
          tagCounts[fundamental[i].tagName] = fundamental[i].problemsSolved;
        }

        // Calculate total solved correctly
        var totalSolved = 0;
        var submissions = data.data.matchedUser.submitStats.acSubmissionNum;
        console.log("Submission Stats:", submissions);
        // Ensure we get the "All" difficulty count
        for (var i = 0; i < submissions.length; i++) {
          if (submissions[i].difficulty === "All") {
            totalSolved = submissions[i].count;
            break;
          }
        }
        console.log("Total Solved Calculated:", totalSolved);

        var profile = {
          username: data.data.matchedUser.username,
          ranking: data.data.matchedUser.profile.ranking || "N/A",
          totalSolved: totalSolved
        };

        return { status: "success", tagCounts: tagCounts, profile: profile };
      });
  }

  function fetchCalendarData(username) {
    return fetch("/api/leetcode/calendar/" + encodeURIComponent(username))
      .then(function(response) {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        console.log("API Response (Calendar):", JSON.stringify(data, null, 2));
        if (data.errors || !data.data.matchedUser) throw new Error("User not found");
        var calendar = JSON.parse(data.data.matchedUser.userCalendar.submissionCalendar || "{}");
        return calendar;
      });
  }

  function fetchProblems(topic) {
    return fetch("/api/leetcode/problems/" + encodeURIComponent(topic))
      .then(function(response) {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        console.log("Recommended Problems for " + topic + ":", JSON.stringify(data, null, 2));
        var questions = data.data && data.data.problemsetQuestionList ? data.data.problemsetQuestionList.questions : [];
        if (questions.length > 0) {
          return {
            title: questions[0].title,
            url: "https://leetcode.com/problems/" + questions[0].titleSlug + "/"
          };
        } else {
          return {
            title: "Practice " + topic,
            url: "https://leetcode.com/problemset/?topicSlugs=" + topic.toLowerCase().replace(/ /g, "-")
          };
        }
      })
      .catch(function(err) {
        console.log("Failed to get problems for " + topic + ": " + err.message);
        return {
          title: "Practice " + topic,
          url: "https://leetcode.com/problemset/?topicSlugs=" + topic.toLowerCase().replace(/ /g, "-")
        };
      });
  }

  function processData(userData, calendarData) {
    var profile = userData.profile || defaultData.profile;

    var tags = [];
    if (userData.tagCounts) {
      for (var tagName in userData.tagCounts) {
        tags.push({ tagName: tagName, problemsSolved: userData.tagCounts[tagName] });
      }
    }

    var topicCoverage = [];
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].problemsSolved > 0) {
        var estimatedTotal = 100; // Rough estimate
        var coverage = Math.min((tags[i].problemsSolved / estimatedTotal) * 100, 100);
        topicCoverage.push({ topic: tags[i].tagName, coverage: Math.round(coverage) });
      }
    }
    topicCoverage = topicCoverage.slice(0, 6); // Top 6 topics

    if (topicCoverage.length === 0) {
      console.log("No topic data, using default");
      return {
        profile: profile,
        topicCoverage: defaultData.topicCoverage,
        weakTopics: defaultData.weakTopics,
        recommendedProblems: defaultData.recommendedProblems,
        resources: defaultData.resources,
        submissionCalendar: calendarData
      };
    }

    var weakTopics = [];
    for (var i = 0; i < topicCoverage.length; i++) {
      if (topicCoverage[i].coverage < 30) {
        weakTopics.push({
          topic: topicCoverage[i].topic,
          description: "You have solved fewer problems in " + topicCoverage[i].topic + ". Practice more to improve your skills."
        });
      }
    }

    var recommendedProblemsPromise = weakTopics.length > 0
      ? Promise.all(weakTopics.map(function(wt) { return fetchProblems(wt.topic); }))
      : Promise.resolve(defaultData.recommendedProblems);

    var resourceMap = {
      "Dynamic Programming": "https://www.geeksforgeeks.org/dynamic-programming/",
      "Graphs": "https://www.programiz.com/dsa/graph-data-structure",
      "Trees": "https://www.tutorialspoint.com/data_structures_algorithms/tree_data_structure.htm",
      "Arrays": "https://www.geeksforgeeks.org/array-data-structure/",
      "Strings": "https://www.geeksforgeeks.org/string-data-structure/",
      "Math": "https://www.geeksforgeeks.org/mathematical-algorithms/",
      "Hash Table": "https://www.geeksforgeeks.org/hashing-data-structure/",
      "Binary Search": "https://www.geeksforgeeks.org/binary-search/",
      "Greedy": "https://www.geeksforgeeks.org/greedy-algorithms/"
    };

    var resources = [];
    if (weakTopics.length > 0) {
      for (var i = 0; i < weakTopics.length; i++) {
        var topic = weakTopics[i].topic;
        var url = resourceMap[topic] || "https://www.geeksforgeeks.org/tag/" + topic.toLowerCase().replace(/ /g, "-") + "/";
        resources.push({ topic: topic, url: url });
      }
    } else {
      resources = defaultData.resources;
    }

    return recommendedProblemsPromise.then(function(recommendedProblems) {
      return {
        profile: profile,
        topicCoverage: topicCoverage,
        weakTopics: weakTopics,
        recommendedProblems: recommendedProblems,
        resources: resources,
        submissionCalendar: calendarData
      };
    });
  }

  function showError(err, username) {
    var msg = "";
    var showRetry = false;

    if (err.message === "User not found") {
      msg = 'Username "' + username + '" is not available. Please check the username and try again.';
    } else if (err.message.indexOf("429") !== -1) {
      msg = err.message + " Retrying might help.";
      showRetry = true;
    } else {
      msg = "Failed to fetch data: " + err.message + ". Please try again later.";
      showRetry = true;
    }

    if (showRetry) {
      error.innerHTML = msg + ' <button id="retry-button" class="text-amber-400 underline hover:text-amber-300">Retry</button>';
    } else {
      error.innerHTML = msg;
    }

    error.classList.remove("hidden");

    if (showRetry) {
      var retryButton = document.getElementById("retry-button");
      if (retryButton) {
        retryButton.addEventListener("click", function() {
          form.dispatchEvent(new Event("submit"));
        });
      }
    }
  }

  function processCalendar(submissionCalendar) {
    var startDate = new Date("2024-05-23"); // One year ago
    var endDate = new Date("2025-05-23"); // Today
    var days = [];
    var maxSubmissions = 1;

    // Find the max submission count for scaling colors
    for (var timestamp in submissionCalendar) {
      if (submissionCalendar[timestamp] > maxSubmissions) {
        maxSubmissions = submissionCalendar[timestamp];
      }
    }

    // Fill in all days from start to end
    var currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      var timestamp = Math.floor(currentDate.getTime() / 1000);
      var count = submissionCalendar[timestamp] || 0;
      var intensity = count / maxSubmissions;
      var dateString = currentDate.toISOString().split("T")[0];
      days.push({
        date: dateString,
        count: count,
        intensity: intensity,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
        day: currentDate.getDate()
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group days by year and month
    var months = [];
    var currentYear = 2024;
    var currentMonth = 4; // May 2024 (0-based)
    while (currentYear < 2026) {
      var yearMonth = `${currentYear}-${currentMonth}`;
      var monthDays = days.filter(function(day) {
        return day.year === currentYear && day.month === currentMonth;
      });
      months.push({
        yearMonth: yearMonth,
        year: currentYear,
        month: currentMonth,
        days: monthDays
      });

      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      if (currentYear === 2025 && currentMonth > 4) break; // Stop after May 2025
    }

    return { months: months, maxSubmissions: maxSubmissions };
  }

  function renderMonth(container, monthData, maxSubmissions) {
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var monthName = monthNames[monthData.month];
    var year = monthData.year;

    // Create the month grid
    var grid = document.createElement("div");
    grid.className = "calendar-grid";

    // Add day-of-week headers
    var dayHeaders = document.createElement("div");
    dayHeaders.className = "day-headers";
    var daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (var i = 0; i < daysOfWeek.length; i++) {
      var header = document.createElement("span");
      header.className = "day-header";
      header.textContent = daysOfWeek[i];
      dayHeaders.appendChild(header);
    }
    grid.appendChild(dayHeaders);

    // Create the grid for days
    var firstDayOfMonth = new Date(year, monthData.month, 1);
    var firstDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Adjust to Mon-Sun (Mon=0, Sun=6)
    var daysInMonth = new Date(year, monthData.month + 1, 0).getDate();
    var totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7; // Ensure full weeks

    var dayGrid = document.createElement("div");
    dayGrid.className = "day-grid";
    for (var i = 0; i < totalCells; i++) {
      var daySquare = document.createElement("div");
      daySquare.className = "day-square";
      var dayIndex = i - firstDayOfWeek + 1;

      if (dayIndex > 0 && dayIndex <= daysInMonth) {
        // This is a valid day in the month
        var dayData = monthData.days.find(function(d) {
          return d.day === dayIndex;
        });
        if (dayData) {
          var intensity = dayData.intensity;
          var colorLevel = intensity === 0 ? 0 : Math.ceil(intensity * 4);
          daySquare.classList.add("intensity-" + colorLevel);
          daySquare.setAttribute("data-date", dayData.date);
          daySquare.setAttribute("data-count", dayData.count);
          daySquare.textContent = dayIndex;
        }
      } else {
        // Empty cell (before or after the month)
        daySquare.classList.add("empty");
      }

      dayGrid.appendChild(daySquare);
    }
    grid.appendChild(dayGrid);

    // Add legend
    var legend = document.createElement("div");
    legend.className = "calendar-legend";
    legend.innerHTML = `
      <span class="legend-label">Less</span>
      <div class="legend-square intensity-0"></div>
      <div class="legend-square intensity-1"></div>
      <div class="legend-square intensity-2"></div>
      <div class="legend-square intensity-3"></div>
      <div class="legend-square intensity-4"></div>
      <span class="legend-label">More</span>
    `;
    grid.appendChild(legend);

    container.appendChild(grid);

    // Add tooltips
    var squares = container.getElementsByClassName("day-square");
    for (var i = 0; i < squares.length; i++) {
      squares[i].addEventListener("mouseover", function(e) {
        if (e.target.classList.contains("empty")) return;
        var date = e.target.getAttribute("data-date");
        var count = e.target.getAttribute("data-count");
        var tooltip = document.createElement("div");
        tooltip.className = "calendar-tooltip";
        tooltip.textContent = count + " submissions on " + date;
        tooltip.style.left = (e.clientX + 15) + "px";
        tooltip.style.top = (e.clientY - 40) + "px";
        var rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          tooltip.style.left = (e.clientX - rect.width - 15) + "px";
        }
        if (rect.bottom > window.innerHeight) {
          tooltip.style.top = (e.clientY - rect.height - 15) + "px";
        }
        document.body.appendChild(tooltip);
      });
      squares[i].addEventListener("mouseout", function() {
        var tooltip = document.querySelector(".calendar-tooltip");
        if (tooltip) {
          tooltip.remove();
        }
      });
    }
  }

  function showResults(data) {
    results.classList.remove("hidden");

    if (data === defaultData) {
      error.innerHTML = "Warning: Displaying default data due to API issues.";
      error.classList.remove("hidden");
    }

    // Show user profile
    var profileDiv = document.createElement("div");
    profileDiv.className = "glass flex items-center p-6 rounded-xl shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:scale-105 glow card";
    profileDiv.innerHTML = `
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 flex items-center justify-center mr-6">
        <span class="text-2xl font-bold text-gray-900">${data.profile.username.charAt(0).toUpperCase()}</span>
      </div>
      <div>
        <h3 class="text-xl font-semibold text-amber-400 mb-2 tracking-wide">User Profile</h3>
        <p class="text-gray-200 text-lg"><span class="font-medium">Username:</span> ${data.profile.username}</p>
        <p class="text-gray-200 text-lg"><span class="font-medium">Ranking:</span> ${data.profile.ranking}</p>
        <p class="text-gray-200 text-lg"><span class="font-medium">Total Solved:</span> ${data.profile.totalSolved}</p>
      </div>
    `;
    profileSection.appendChild(profileDiv);

    // Show topic coverage chart
    if (data.topicCoverage.length === 0) {
      error.innerHTML = "No topic coverage data available for this user.";
      error.classList.remove("hidden");
      return;
    }

    var topicCanvas = document.getElementById("topic-chart");
    if (!topicCanvas) {
      console.log("Topic chart canvas not found!");
      error.innerHTML = "Error: Unable to render topic chart.";
      error.classList.remove("hidden");
      return;
    }
    var topicCtx = topicCanvas.getContext("2d");

    if (topicChart) {
      topicChart.destroy();
      topicChart = null;
    }
    topicChart = new Chart(topicCtx, {
      type: "radar",
      data: {
        labels: data.topicCoverage.map(function(item) { return item.topic; }),
        datasets: [{
          label: "Coverage (%)",
          data: data.topicCoverage.map(function(item) { return item.coverage; }),
          backgroundColor: "rgba(245, 158, 11, 0.3)",
          borderColor: "#f59e0b",
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              color: "#d1d5db"
            },
            pointLabels: {
              color: "#d1d5db"
            },
            grid: { color: "rgba(255,255,255,0.2)" }
          }
        }
      }
    });

    // Show submission calendar
    if (Object.keys(data.submissionCalendar).length > 0) {
      var calendarData = processCalendar(data.submissionCalendar);
      var months = calendarData.months;
      var maxSubmissions = calendarData.maxSubmissions;

      // Create the calendar container with dropdown
      var calendarWrapper = document.createElement("div");
      calendarWrapper.className = "calendar-wrapper";

      // Add month selector
      var monthSelector = document.createElement("div");
      monthSelector.className = "month-selector mb-4";
      var select = document.createElement("select");
      select.id = "month-select";
      select.className = "p-2 rounded-lg bg-gray-900 text-gray-200 border-2 border-gray-700 focus:border-amber-400 focus:outline-none transition-all duration-300";
      var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      for (var i = 0; i < months.length; i++) {
        var option = document.createElement("option");
        option.value = months[i].yearMonth;
        option.textContent = monthNames[months[i].month] + " " + months[i].year;
        select.appendChild(option);
      }
      // Default to the last month (May 2025)
      select.value = months[months.length - 1].yearMonth;
      monthSelector.appendChild(select);
      calendarWrapper.appendChild(monthSelector);

      // Add calendar container for the month grid
      var monthContainer = document.createElement("div");
      monthContainer.id = "month-container";
      calendarWrapper.appendChild(monthContainer);
      calendarContainer.appendChild(calendarWrapper);

      // Render the selected month
      function renderSelectedMonth() {
        monthContainer.innerHTML = "";
        var selectedYearMonth = select.value;
        var selectedMonth = months.find(function(m) {
          return m.yearMonth === selectedYearMonth;
        });
        if (selectedMonth) {
          renderMonth(monthContainer, selectedMonth, maxSubmissions);
        }
      }

      // Initial render
      renderSelectedMonth();

      // Update calendar when month changes
      select.addEventListener("change", renderSelectedMonth);
    } else {
      calendarContainer.innerHTML = "<p class='text-gray-400 text-center text-lg'>No submission activity available.</p>";
    }

    // Show weak topics
    for (var i = 0; i < data.weakTopics.length; i++) {
      var topic = data.weakTopics[i];
      var div = document.createElement("div");
      div.className = "glass p-6 rounded-xl shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:scale-105 glow card";
      div.innerHTML = "<h3 class='text-xl font-semibold text-amber-400 mb-4 tracking-wide'>" + topic.topic + "</h3><p class='text-gray-200 text-lg'>" + topic.description + "</p>";
      topicsList.appendChild(div);
    }

    // Show recommended problems
    for (var i = 0; i < data.recommendedProblems.length; i++) {
      var problem = data.recommendedProblems[i];
      var li = document.createElement("li");
      li.className = "glass p-4 rounded-xl shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:scale-105 glow card";
      li.innerHTML = "<a href='" + problem.url + "' target='_blank' class='text-amber-400 hover:underline text-lg'>" + problem.title + "</a>";
      problemsList.appendChild(li);
    }

    // Show resources
    for (var i = 0; i < data.recommendedProblems.length; i++) {
      var resource = data.resources[i];
      var li = document.createElement("li");
      li.className = "glass p-4 rounded-xl shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:scale-105 glow card";
      li.innerHTML = "<a href='" + resource.url + "' target='_blank' class='text-amber-400 hover:underline text-lg'>" + resource.topic + "</a>";
      resourcesList.appendChild(li);
    }
  }
});