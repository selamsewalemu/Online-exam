const QuestionCard = ({ question, index, selectedOptions, onChange }) => {
  const isMultiple = question.questionType === 'multiple';

  const handleChange = (optionId) => {
    if (isMultiple) {
      const updated = selectedOptions.includes(optionId)
        ? selectedOptions.filter((id) => id !== optionId)
        : [...selectedOptions, optionId];
      onChange(question._id, updated);
    } else {
      onChange(question._id, [optionId]);
    }
  };

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-gray-900 font-medium text-sm leading-relaxed">{question.questionText}</p>
          <p className="text-xs text-gray-400 mt-1">
            {isMultiple ? 'Select all that apply' : 'Select one answer'} · {question.marks} mark{question.marks > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 pl-11">
        {question.options.map((option) => {
          const isSelected = selectedOptions.includes(option._id);
          return (
            <label
              key={option._id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type={isMultiple ? 'checkbox' : 'radio'}
                name={`question-${question._id}`}
                checked={isSelected}
                onChange={() => handleChange(option._id)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{option.text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
