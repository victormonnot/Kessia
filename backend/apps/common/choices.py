from django.db import models


class Specialty(models.TextChoices):
    GENERAL_MEDICINE = "general_medicine", "General medicine"
    CARDIOLOGY = "cardiology", "Cardiology"
    ONCOLOGY = "oncology", "Oncology"
    NEUROLOGY = "neurology", "Neurology"
    PEDIATRICS = "pediatrics", "Pediatrics"
    SURGERY = "surgery", "Surgery"
    PSYCHIATRY = "psychiatry", "Psychiatry"
    RADIOLOGY = "radiology", "Radiology"
    DERMATOLOGY = "dermatology", "Dermatology"
    ENDOCRINOLOGY = "endocrinology", "Endocrinology"
    GASTROENTEROLOGY = "gastroenterology", "Gastroenterology"
    OTHER = "other", "Other"


class DeliverableType(models.TextChoices):
    RESEARCH_PAPER = "research_paper", "Research paper"
    REVIEW_ARTICLE = "review_article", "Review article"
    CASE_REPORT = "case_report", "Case report"
    ABSTRACT = "abstract", "Abstract"
    OTHER = "other", "Other"
