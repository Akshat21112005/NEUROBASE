import pandas as pd
import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration, Trainer, TrainingArguments
from datasets import Dataset

device = "cuda" if torch.cuda.is_available() else "cpu"
print("Using device:", device)
if device == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))

df = pd.read_csv("./data/train.csv")
df = df.rename(columns={"question": "input_text", "sql": "target_text"})
df = df[["input_text", "target_text"]].dropna()

model_name = "t5-small"
tokenizer = T5Tokenizer.from_pretrained(model_name)
model = T5ForConditionalGeneration.from_pretrained(model_name).to(device)

def preprocess(batch):
    inputs = ["translate English to SQL: " + x for x in batch["input_text"]]
    model_inputs = tokenizer(inputs, max_length=64, padding="max_length", truncation=True)
    labels = tokenizer(text_target=batch["target_text"], max_length=64, padding="max_length", truncation=True)
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

dataset = Dataset.from_pandas(df)
tokenized_dataset = dataset.map(preprocess, batched=True)

training_args = TrainingArguments(
    output_dir="./model/nlp2sql_model",
    per_device_train_batch_size=4,               
    num_train_epochs=1,                         # ✅ 1 epoch for now
    save_strategy="epoch",                      # ✅ Saves checkpoint safely
    save_safetensors=True,                      # ✅ Avoid .bin vulnerability
    logging_dir="./logs",
    fp16=True if device == "cuda" else False,
    logging_steps=100,
                       
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset
)

trainer.train()

model.save_pretrained("./model/nlp2sql_model")
tokenizer.save_pretrained("./model/tokenizer")
