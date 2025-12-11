-- Fonction pour supprimer une question et la retirer de knowledge_queries
CREATE OR REPLACE FUNCTION delete_training_question(question_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Supprimer la question de training_questions
  DELETE FROM training_questions WHERE id = question_id;
  
  -- Retirer l'ID du tableau related_item_ids dans knowledge_queries
  UPDATE knowledge_queries
  SET related_item_ids = array_remove(related_item_ids, question_id)
  WHERE question_id = ANY(related_item_ids);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
