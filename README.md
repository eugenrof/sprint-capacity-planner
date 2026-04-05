Here is the updated `README.md`. I have optimized the **Technical Insights** section using Markdown code blocks for perfect rendering across all platforms and integrated the new validation logic into the **Key Features** section.

-----

# Sprint Capacity Optimizer | Team Velocity Tool

## 📋 Purpose & Professional Impact

In the **Scrum Framework**, the Sprint Planning event is the heartbeat of a team's cycle. However, one of the most persistent challenges for a **Scrum Master** is moving a team from "gut feeling" to data-driven commitment.

**Sprint Capacity Pro** was developed as a specialized utility to bridge the gap between abstract story points and concrete human availability. By providing a structured, mathematical approach to team capacity, it ensures that the "Forecast" made at the beginning of a sprint is both realistic and sustainable.

### Why this tool?

  * **Precision Planning**: Replaces vague estimates with a concrete "Available Days" metric, allowing the team to see exactly how holidays and personal leave impact their delivery power.
  * **Efficiency**: Reduces the time spent on manual spreadsheets or fighting complex configurations in heavy Jira/Azure DevOps environments during live planning sessions.
  * **Transparency**: Provides a visual, shareable "source of truth" that helps **Product Owners** and stakeholders understand exactly why a team’s velocity might fluctuate in a specific sprint (e.g., due to public holidays or team training).
  * **Zero Overhead**: A focused, high-utility micro-app designed for immediate, zero-setup capacity modeling that can be exported or shared instantly.

-----

## 👥 Target Audience

This tool is specifically crafted for professionals operating within Agile and Scrum environments:

  * **Scrum Masters & Agile Coaches**: To facilitate smoother, data-backed Sprint Planning sessions and protect the team from over-commitment.
  * **Team Leads & Engineering Managers**: To model various "what-if" scenarios regarding team allocation and upcoming leave.
  * **Self-Organizing Development Teams**: To take ownership of their own capacity and provide more accurate forecasts to their stakeholders.

-----

## 🛠️ Key Features

  * **Dynamic Capacity Calculation**: Automatically adjusts team velocity based on specific working windows and individual availability.
  * **Smart Validations**:
      * **Holiday Safety**: Public holidays cannot exceed the sprint duration. If they match or exceed the sprint length, they auto-reset to 0 to maintain logic.
      * **Allocation Capping**: Individual team member allocation is strictly capped at **100%** to prevent over-planning.
      * **Negative Value Protection**: All numerical inputs are guarded against negative values, automatically resetting to 0.
  * **PDF Reporting**: Generate and export a professional summary of the sprint plan, including metrics and detailed team breakdowns, with a single click.
  * **Instant Shareability**: The application state is synchronized with the browser URL. You can share the exact configuration of your team and sprint by simply copying and sending the link.
  * **Persistent State**: Data remains intact across page refreshes thanks to URL-based state management.

-----

## 🧪 Technical Insights

### The Calculation Engine

To ensure maximum compatibility across all Markdown viewers, the tool uses the following logic for real-time modeling:

1.  **Working Window** `Sprint Days - Public Holidays`

2.  **Individual Availability** `(Working Window - Individual Days Off) × (Allocation % / 100)`

3.  **Team Capacity %** `Total Available Days / (Team Size × Sprint Days)`

4.  **Recommended Velocity** `Average Velocity × Team Capacity %`

### Built With

  * **Tailwind CSS**: For a modern, responsive, and "glassmorphic" UI.
  * **Vanilla JavaScript**: High-performance logic without the overhead of heavy frameworks.
  * **jsPDF & AutoTable**: Powering the professional PDF export functionality.

-----

## 💡 Usage Pro-Tips

  * **Direct Editing**: You can click directly on member names in the table to rename them on the fly.
  * **Visual Indicators**: The capacity bar changes color based on team health:
      * 🟢 **High**: $\ge$ 75% Capacity
      * 🟠 **Mid**: 50% - 74% Capacity
      * 🔴 **Low**: \< 50% Capacity
  * **Global Reset**: Use the "Reset Table Data" button to clear all custom inputs and return to the default team structure.

-----

## ⚖️ License & Credits

Developed by **Eugen Rof** (2026). Part of the **Scrum Master Toolset**.
[GitHub Repository](https://www.google.com/search?q=https://github.com/eugenrof)
