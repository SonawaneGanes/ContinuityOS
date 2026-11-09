export default function ExportButton({ claims, projectId }) {
  function download() {
    const lines = ["# ContinuityOS Handover", "", `Project: ${projectId}`, ""];
    for (const claim of claims) {
      const owner = claim.owner ? `Owner: ${claim.owner}` : "No owner";
      const due = claim.due_date ? ` - due ${claim.due_date}` : "";
      lines.push(`- [${claim.label}] ${claim.subject} (${owner})${due}`);
      lines.push("", `  > Source: ${claim.quote}`, "");
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `handover_project_${projectId}.md`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <button
      className="button button-secondary"
      disabled={claims.length === 0}
      onClick={download}
      type="button"
    >
      Export Markdown
    </button>
  );
}
