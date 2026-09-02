// Five clickable stars. `value` is the rating already saved (or null), and
// clicking a star sends the new score up to the parent.
export default function RatingPicker({ value, onPick, disabled }) {
  return (
    <span className="rating-picker">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onPick(score)}
          className={score <= (value || 0) ? "star filled" : "star"}
          title={`Rate ${score} out of 5`}
          aria-label={`Rate ${score} out of 5`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
