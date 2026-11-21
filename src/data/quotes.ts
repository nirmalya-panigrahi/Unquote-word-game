
import { calculateDifficulty } from '../lib/crypto';

export interface Quote {
  id: number;
  text: string;
  author: string;
  source?: string;
}

const rawQuotes: Quote[] = [
  { id: 1, text: "Knowledge is power.", author: "Francis Bacon" },
  { id: 2, text: "I think, therefore I am.", author: "René Descartes" },
  { id: 3, text: "We’re all mad here.", author: "Lewis Carroll", source: "Alice’s Adventures in Wonderland" },
  { id: 4, text: "The unexamined life is not worth living.", author: "Socrates" },
  { id: 5, text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { id: 6, text: "To be or not to be, that is the question.", author: "William Shakespeare", source: "Hamlet" },
  { id: 7, text: "To thine own self be true.", author: "William Shakespeare", source: "Hamlet" },
  { id: 8, text: "Parting is such sweet sorrow.", author: "William Shakespeare", source: "Romeo and Juliet" },
  { id: 9, text: "Nothing is certain except death and taxes.", author: "Benjamin Franklin" },
  { id: 10, text: "All for one and one for all.", author: "Alexandre Dumas", source: "The Three Musketeers" },
  { id: 11, text: "Give me liberty or give me death!", author: "Patrick Henry" },
  { id: 12, text: "I came, I saw, I conquered.", author: "Julius Caesar" },
  { id: 13, text: "Speak softly and carry a big stick; you will go far.", author: "Theodore Roosevelt" },
  { id: 14, text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { id: 15, text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { id: 16, text: "What does not kill me makes me stronger.", author: "Friedrich Nietzsche" },
  { id: 17, text: "If you tell the truth, you don’t have to remember anything.", author: "Mark Twain" },
  { id: 18, text: "I have not failed. I’ve just found 10,000 ways that won’t work.", author: "Thomas Edison" },
  { id: 19, text: "Genius is one percent inspiration, ninety-nine percent perspiration.", author: "Thomas Edison" },
  { id: 20, text: "Opportunity is missed by most people because it is dressed in overalls and looks like work.", author: "Thomas Edison" },
  { id: 21, text: "That’s one small step for man, one giant leap for mankind.", author: "Neil Armstrong", source: "Apollo 11 landing, 1969" },
  { id: 22, text: "The reports of my death have been greatly exaggerated.", author: "Mark Twain" },
  { id: 23, text: "I can resist everything except temptation.", author: "Oscar Wilde" },
  { id: 24, text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
  { id: 25, text: "It was the best of times, it was the worst of times.", author: "Charles Dickens", source: "A Tale of Two Cities" },
  { id: 26, text: "’Tis better to have loved and lost than never to have loved at all.", author: "Alfred Lord Tennyson" },
  { id: 27, text: "A rose by any other name would smell as sweet.", author: "William Shakespeare", source: "Romeo and Juliet" },
  { id: 28, text: "If music be the food of love, play on.", author: "William Shakespeare", source: "Twelfth Night" },
  { id: 29, text: "There is nothing either good or bad, but thinking makes it so.", author: "William Shakespeare", source: "Hamlet" },
  { id: 30, text: "Hell is empty and all the devils are here.", author: "William Shakespeare", source: "The Tempest" },
  { id: 31, text: "Government of the people, by the people, for the people, shall not perish from the earth.", author: "Abraham Lincoln", source: "Gettysburg Address" },
  { id: 32, text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },
  { id: 33, text: "Ask not what your country can do for you — ask what you can do for your country.", author: "John F. Kennedy" },
  { id: 34, text: "Politics is the art of the possible.", author: "Otto von Bismarck" },
  { id: 35, text: "There are three kinds of lies: lies, damned lies, and statistics.", author: "Mark Twain" },
  { id: 36, text: "The pen is mightier than the sword.", author: "Edward Bulwer-Lytton" },
  { id: 37, text: "Power tends to corrupt, and absolute power corrupts absolutely.", author: "John Dalberg-Acton" },
  { id: 38, text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { id: 39, text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { id: 40, text: "Injustice anywhere is a threat to justice everywhere.", author: "Martin Luther King Jr.", source: "Letter from Birmingham Jail" },
  { id: 41, text: "Those who cannot remember the past are condemned to repeat it.", author: "George Santayana", source: "The Life of Reason" },
  { id: 42, text: "Man is born free, and everywhere he is in chains.", author: "Jean-Jacques Rousseau", source: "The Social Contract" },
  { id: 43, text: "Call me Ishmael.", author: "Herman Melville", source: "Moby-Dick" },
  { id: 44, text: "Not all those who wander are lost.", author: "J. R. R. Tolkien", source: "The Fellowship of the Ring" },
  { id: 45, text: "All happy families are alike; each unhappy family is unhappy in its own way.", author: "Leo Tolstoy", source: "Anna Karenina" },
  { id: 46, text: "Brevity is the soul of wit.", author: "William Shakespeare", source: "Hamlet" },
  { id: 47, text: "Imagination is more important than knowledge.", author: "Albert Einstein" },
  { id: 48, text: "I am the master of my fate, I am the captain of my soul.", author: "William Ernest Henley", source: "Invictus" },
  { id: 49, text: "Fortune favors the bold.", author: "Virgil", source: "Aeneid" },
  { id: 50, text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", author: "Jane Austen", source: "Pride and Prejudice" }
];

// Progressive Difficulty Sort
export const QUOTES = [...rawQuotes].sort((a, b) => {
  const diffA = calculateDifficulty(a.text).score;
  const diffB = calculateDifficulty(b.text).score;
  return diffA - diffB;
});
