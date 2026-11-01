// src/features/exercises/ExerciseList.js
// Elenco leggibile degli esercizi di una scheda: numero, nome, gruppo muscolare e serie × rip.
import React from 'react';
import { categoryColor } from './categoryColors';

export default function ExerciseList({ exercises }) {
  return (
    <ol className="ex-list">
      {exercises.map((e, i) => (
        <li key={`${e.exerciseId}-${i}`}>
          <span className="ex-n">{i + 1}</span>
          <span className="ex-name">
            {e.name}
            <small><i className="dot" style={{ background: categoryColor(e.category) }} />{e.category}</small>
          </span>
          <span className="ex-sr">{e.sets}×{e.reps}</span>
        </li>
      ))}
    </ol>
  );
}
