"""
Unit Tests for AI Subject Validator

Tests the validation logic:
1. Title AI signals → DEFINITE PASS
2. Non-AI subjects → DEFINITE DROP
3. Gold standard archetypes → MUST PASS
4. Content AI substance → PASS
5. Borderline cases → LLM verification
6. No signals → DROP
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.ai_subject_validator import AISubjectValidator, ValidationResult


@pytest.fixture
def validator():
    """Create AISubjectValidator instance for tests."""
    return AISubjectValidator()


class TestTitleAISignals:
    """DEFINITE PASS: Title contains strong AI signal."""

    def test_title_with_ai(self, validator):
        """Title with 'AI' should pass."""
        result = validator.validate("New AI tool launches in India")
        assert result.passed is True
        assert result.reason == 'TITLE_AI_STRONG'
        assert result.confidence == 'high'

    def test_title_with_artificial_intelligence(self, validator):
        """Title with 'artificial intelligence' should pass."""
        result = validator.validate("Artificial Intelligence transforms healthcare")
        assert result.passed is True
        assert result.reason == 'TITLE_AI_STRONG'

    def test_title_with_machine_learning(self, validator):
        """Title with 'machine learning' should pass."""
        result = validator.validate("Machine learning model achieves record accuracy")
        assert result.passed is True
        assert result.reason == 'TITLE_AI_STRONG'

    def test_title_with_genai(self, validator):
        """Title with 'GenAI' should pass."""
        result = validator.validate("GenAI adoption surges in enterprises")
        assert result.passed is True
        assert result.reason == 'TITLE_AI_STRONG'

    def test_title_with_llm(self, validator):
        """Title with 'LLM' should pass."""
        result = validator.validate("New LLM outperforms GPT-4")
        assert result.passed is True
        assert result.reason == 'TITLE_AI_STRONG'

    def test_title_with_chatgpt(self, validator):
        """Title with 'ChatGPT' should pass."""
        result = validator.validate("ChatGPT users reach 200 million milestone")
        assert result.passed is True
        assert result.reason == 'TITLE_AI_STRONG'

    def test_title_with_deep_learning(self, validator):
        """Title with 'deep learning' should pass."""
        result = validator.validate("Deep learning breakthrough in image recognition")
        assert result.passed is True
        assert result.reason == 'TITLE_AI_STRONG'

    def test_title_with_neural_network(self, validator):
        """Title with 'neural network' should pass."""
        result = validator.validate("Neural network predicts protein structures")
        assert result.passed is True
        assert result.reason == 'TITLE_AI_STRONG'


class TestNonAISubjects:
    """DEFINITE DROP: Title indicates non-AI subject."""

    def test_cricket_match(self, validator):
        """Cricket content should be dropped."""
        result = validator.validate("India vs Australia cricket match highlights")
        assert result.passed is False
        assert result.reason == 'NON_AI_SUBJECT'

    def test_weather_forecast(self, validator):
        """Weather content should be dropped."""
        result = validator.validate("Mumbai weather forecast for tomorrow")
        assert result.passed is False
        assert result.reason == 'NON_AI_SUBJECT'

    def test_bollywood_news(self, validator):
        """Bollywood content should be dropped."""
        result = validator.validate("Bollywood star launches new perfume brand")
        assert result.passed is False
        assert result.reason == 'NON_AI_SUBJECT'

    def test_crime_news(self, validator):
        """Crime content should be dropped."""
        result = validator.validate("Three arrested for theft in Delhi")
        assert result.passed is False
        assert result.reason == 'NON_AI_SUBJECT'

    def test_election_news(self, validator):
        """Election content without AI should be dropped."""
        result = validator.validate("Election results: Party wins majority")
        assert result.passed is False
        assert result.reason == 'NON_AI_SUBJECT'


class TestGoldStandardArchetypes:
    """Gold standard archetypes that MUST always pass."""

    def test_archetype_product_launch(self, validator, monkeypatch):
        """A weak title with one content signal is reviewed by the model."""
        monkeypatch.setattr(validator, "_llm_verify", lambda *args, **kwargs: {
            "is_subject": True, "classification": "SUBJECT"})
        result = validator.validate(
            "Zoho launches AI-powered analytics tool",
            "The company unveiled its new artificial intelligence product..."
        )
        assert result.passed is True
        assert result.reason == 'TITLE_WEAK_LLM:SUBJECT'
        assert result.llm_used is True

    def test_archetype_research_paper(self, validator):
        """AI research publication should pass."""
        result = validator.validate(
            "IIT Madras researchers publish NLP breakthrough",
            "The research paper details a new approach to natural language processing..."
        )
        assert result.passed is True

    def test_archetype_funding(self, validator):
        """AI company funding should pass."""
        result = validator.validate(
            "Sarvam AI raises $50M Series B funding",
            "The AI startup secured funding from leading investors..."
        )
        assert result.passed is True

    def test_archetype_infrastructure(self, validator):
        """AI infrastructure investment should pass."""
        result = validator.validate(
            "Microsoft to build AI data centre in Hyderabad",
            "The tech giant announced plans to construct a data centre for AI workloads..."
        )
        assert result.passed is True

    def test_archetype_policy(self, validator):
        """AI policy/regulation should pass."""
        result = validator.validate(
            "MeitY releases AI governance framework",
            "The Ministry of Electronics and IT published guidelines for AI governance..."
        )
        assert result.passed is True

    def test_archetype_talent(self, validator):
        """AI hiring news should pass."""
        result = validator.validate(
            "TCS to hire 10,000 AI engineers in 2026",
            "The company plans to expand its artificial intelligence team..."
        )
        assert result.passed is True

    def test_archetype_domain_application(self, validator):
        """AI application in domain should pass."""
        result = validator.validate(
            "AI tool detects cancer in 30 seconds",
            "The machine learning system can identify tumors with 98% accuracy..."
        )
        assert result.passed is True

    def test_archetype_partnership(self, validator):
        """AI partnership should pass."""
        result = validator.validate(
            "Google partners with IIIT for AI research",
            "The collaboration will focus on machine learning research..."
        )
        assert result.passed is True

    def test_archetype_event(self, validator):
        """AI event/summit should pass."""
        result = validator.validate(
            "India AI Summit 2026 at Bangalore",
            "The annual conference on artificial intelligence will be held..."
        )
        assert result.passed is True

    def test_archetype_market_trends(self, validator):
        """AI market trends should pass."""
        result = validator.validate(
            "India's GenAI market to reach $17B by 2030",
            "The market forecast predicts significant growth in AI adoption..."
        )
        assert result.passed is True


class TestContentAISubstance:
    """Content with strong AI substance should pass."""

    def test_multiple_ai_terms_in_content(self, validator):
        """Multiple AI terms in content should pass."""
        result = validator.validate(
            "Tech company announces new features",
            "The company's new product uses a transformer model trained on large datasets. "
            "The neural network achieves high accuracy through deep learning techniques. "
            "GPU inference enables real-time predictions with low latency."
        )
        assert result.passed is True
        # Should pass via CONTENT_AI_SUBSTANCE or archetype

    def test_ai_technical_content(self, validator):
        """Technical AI content should pass."""
        result = validator.validate(
            "Improving model performance",
            "We fine-tuned the transformer model using supervised learning. "
            "The training data consisted of 10 million examples. "
            "After 100 epochs, the model achieved 95% accuracy on the benchmark dataset."
        )
        assert result.passed is True


class TestNoAISignal:
    """Articles without AI signals should be dropped."""

    def test_generic_tech_news(self, validator):
        """Generic tech news without AI should be dropped."""
        result = validator.validate(
            "Company uses modern technology for efficiency",
            "The company implemented new software systems to improve operations."
        )
        assert result.passed is False
        assert result.reason == 'NO_AI_SIGNAL'

    def test_generic_business_news(self, validator):
        """Generic business news should be dropped."""
        result = validator.validate(
            "Company reports quarterly earnings",
            "Revenue increased by 15% in the fourth quarter."
        )
        assert result.passed is False
        assert result.reason == 'NO_AI_SIGNAL'


class TestEdgeCases:
    """Edge cases and boundary conditions."""

    def test_empty_title(self, validator):
        """Empty title should work."""
        result = validator.validate("", "")
        assert result.passed is False
        assert result.reason == 'NO_AI_SIGNAL'

    def test_none_content(self, validator):
        """None content should work."""
        result = validator.validate("AI news headline", None)
        assert result.passed is True  # Title has AI
        assert result.reason == 'TITLE_AI_STRONG'

    def test_very_long_content(self, validator):
        """Very long content should not crash."""
        long_content = "AI " * 10000  # 30000 chars
        result = validator.validate("AI news", long_content)
        assert isinstance(result, ValidationResult)
        assert result.passed is True

    def test_special_characters(self, validator):
        """Special characters should not crash."""
        result = validator.validate(
            "AI & ML: ₹500Cr investment",
            "Investment of ₹500 crore (approx $60M) announced."
        )
        assert isinstance(result, ValidationResult)

    def test_case_insensitivity(self, validator):
        """Should work regardless of case."""
        result = validator.validate("NEW AI TOOL LAUNCHES")
        assert result.passed is True
        assert result.reason == 'TITLE_AI_STRONG'

    def test_lowercase_ai(self, validator):
        """Lowercase 'ai' should also match."""
        result = validator.validate("New ai solution for enterprises")
        assert result.passed is True


class TestValidationResult:
    """Test ValidationResult dataclass."""

    def test_result_attributes(self, validator):
        """Result should have all expected attributes."""
        result = validator.validate("AI tool launches")
        assert hasattr(result, 'passed')
        assert hasattr(result, 'reason')
        assert hasattr(result, 'ai_score')
        assert hasattr(result, 'matched_patterns')
        assert hasattr(result, 'confidence')
        assert hasattr(result, 'llm_used')

    def test_matched_patterns_list(self, validator):
        """matched_patterns should be a list."""
        result = validator.validate("AI tool launches")
        assert isinstance(result.matched_patterns, list)


class TestFilterArticleCompatibility:
    """Test filter_article method for orchestrator compatibility."""

    def test_filter_article_returns_dict(self, validator):
        """filter_article should return dict with expected keys."""
        article = {
            'title': 'AI tool launches',
            'content': 'New AI product available.'
        }
        result = validator.filter_article(article)
        assert isinstance(result, dict)
        assert 'passed' in result
        assert 'total_score' in result
        assert 'confidence' in result
        assert 'breakdown' in result

    def test_filter_article_with_ai(self, validator):
        """filter_article should pass AI articles."""
        article = {
            'title': 'Machine learning model achieves breakthrough',
            'content': 'The AI system...'
        }
        result = validator.filter_article(article)
        assert result['passed'] is True

    def test_filter_article_without_ai(self, validator):
        """filter_article should drop non-AI articles."""
        article = {
            'title': 'Weather forecast for Delhi',
            'content': 'Rain expected tomorrow.'
        }
        result = validator.filter_article(article)
        assert result['passed'] is False


class TestRealWorldExamples:
    """Test with real-world-like examples."""

    def test_zoho_ai_product(self, validator):
        """Zoho AI product launch should pass."""
        result = validator.validate(
            "Zoho unveils Zia AI for CRM automation",
            "Zoho announced Zia, an AI-powered assistant for its CRM platform."
        )
        assert result.passed is True

    def test_iit_research(self, validator):
        """IIT AI research should pass."""
        result = validator.validate(
            "IIT Delhi develops AI model for traffic prediction",
            "Researchers at IIT Delhi created a machine learning model..."
        )
        assert result.passed is True

    def test_startup_funding(self, validator):
        """AI startup funding should pass."""
        result = validator.validate(
            "Krutrim raises $100M at unicorn valuation",
            "The AI startup founded by Bhavish Aggarwal secured funding..."
        )
        assert result.passed is True

    def test_govt_ai_initiative(self, validator):
        """Government AI initiative should pass."""
        result = validator.validate(
            "Karnataka launches AI skilling program",
            "The state government announced an AI training initiative..."
        )
        assert result.passed is True

    def test_generic_tech_company_news(self, validator):
        """Generic tech company news without AI should fail."""
        result = validator.validate(
            "TCS wins $500M contract",
            "The IT services company secured a deal with a US client."
        )
        # Should fail - no AI mention
        assert result.passed is False


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
