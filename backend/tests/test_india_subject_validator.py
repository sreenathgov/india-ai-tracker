"""
Unit Tests for India Subject Validator

Tests the validation logic:
1. Title India signals → DEFINITE PASS
2. Non-India subjects → DEFINITE DROP
3. Content India substance → PASS
4. Borderline cases → LLM verification
5. No signals → DROP
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.india_subject_validator import IndiaSubjectValidator, IndiaValidationResult


@pytest.fixture
def validator():
    """Create IndiaSubjectValidator instance for tests."""
    return IndiaSubjectValidator()


class TestTitleIndiaSignals:
    """DEFINITE PASS: Title contains strong India signal."""

    def test_title_with_india(self, validator):
        """Title with 'India' should pass."""
        result = validator.validate("India's AI market to grow 50% by 2030")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIA_DIRECT'

    def test_title_with_indian(self, validator):
        """Title with 'Indian' should pass."""
        result = validator.validate("Indian startups raise record AI funding")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIA_DIRECT'

    def test_title_with_bangalore(self, validator):
        """Title with Indian city should pass."""
        result = validator.validate("Google expands AI team in Bangalore")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIA_LOCATION'

    def test_title_with_hyderabad(self, validator):
        """Title with Hyderabad should pass."""
        result = validator.validate("Microsoft opens AI centre in Hyderabad")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIA_LOCATION'

    def test_title_with_karnataka(self, validator):
        """Title with Indian state should pass."""
        result = validator.validate("Karnataka government announces AI policy")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIA_LOCATION'

    def test_title_with_tcs(self, validator):
        """Title with Indian company should pass."""
        result = validator.validate("TCS launches AI platform for enterprises")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIAN_COMPANY'

    def test_title_with_infosys(self, validator):
        """Title with Infosys should pass."""
        result = validator.validate("Infosys unveils new generative AI tools")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIAN_COMPANY'

    def test_title_with_sarvam(self, validator):
        """Title with Indian AI startup should pass."""
        result = validator.validate("Sarvam AI raises $50M Series B")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIAN_COMPANY'

    def test_title_with_krutrim(self, validator):
        """Title with Krutrim should pass."""
        result = validator.validate("Krutrim becomes India's first AI unicorn")
        assert result.passed is True
        # Could be either TITLE_INDIAN_COMPANY or TITLE_INDIA_DIRECT

    def test_title_with_meity(self, validator):
        """Title with MeitY should pass."""
        result = validator.validate("MeitY releases AI governance framework")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIAN_GOVT'

    def test_title_with_niti_aayog(self, validator):
        """Title with NITI Aayog should pass."""
        result = validator.validate("NITI Aayog publishes national AI strategy")
        assert result.passed is True
        assert result.reason == 'TITLE_INDIAN_GOVT'

    def test_title_with_iit(self, validator):
        """Title with IIT should pass."""
        result = validator.validate("IIT Madras researchers develop new NLP model")
        assert result.passed is True
        # May match as location (Madras) or institution (IIT) - both are valid
        assert 'TITLE_' in result.reason


class TestNonIndiaSubjects:
    """DEFINITE DROP: Title indicates non-India subject."""

    def test_chatgpt_global_outage(self, validator):
        """Global ChatGPT news should be dropped."""
        result = validator.validate("ChatGPT down globally, users report widespread issues")
        assert result.passed is False

    def test_openai_ceo_news(self, validator):
        """OpenAI internal news should be dropped."""
        result = validator.validate("OpenAI CEO Altman discusses AGI timeline")
        assert result.passed is False

    def test_anthropic_product(self, validator):
        """Anthropic product news should be dropped."""
        result = validator.validate("Anthropic releases Claude 4 with improved reasoning")
        assert result.passed is False

    def test_us_regulation(self, validator):
        """US regulation news should be dropped."""
        result = validator.validate("US Senate debates AI regulation bill")
        assert result.passed is False

    def test_nvidia_earnings(self, validator):
        """NVIDIA earnings should be dropped."""
        result = validator.validate("NVIDIA earnings beat Wall Street estimates")
        assert result.passed is False

    def test_roblox_ai(self, validator):
        """Foreign company AI product should be dropped."""
        result = validator.validate("Roblox launches AI tech for 3D models")
        assert result.passed is False

    def test_eu_ai_act(self, validator):
        """EU AI regulation should be dropped."""
        result = validator.validate("EU AI Act comes into force across Europe")
        assert result.passed is False


class TestGoldStandardArchetypes:
    """Gold standard archetypes that MUST always pass."""

    def test_archetype_indian_company(self, validator):
        """Indian company AI news should pass."""
        result = validator.validate(
            "TCS launches AI platform for enterprises",
            "Tata Consultancy Services unveiled a new AI platform..."
        )
        assert result.passed is True

    def test_archetype_indian_startup(self, validator):
        """Indian startup funding should pass."""
        result = validator.validate(
            "Sarvam AI raises $50M Series B",
            "The Bangalore-based AI startup has raised funding..."
        )
        assert result.passed is True

    def test_archetype_govt_policy(self, validator):
        """Indian government AI policy should pass."""
        result = validator.validate(
            "MeitY announces AI governance framework",
            "The Ministry of Electronics and IT released guidelines..."
        )
        assert result.passed is True

    def test_archetype_state_initiative(self, validator):
        """Indian state AI initiative should pass."""
        result = validator.validate(
            "Karnataka launches AI skilling program",
            "The state government announced a new initiative..."
        )
        assert result.passed is True

    def test_archetype_facility_in_india(self, validator):
        """AI facility in India should pass."""
        result = validator.validate(
            "Microsoft opens AI centre in Hyderabad",
            "The tech giant is expanding its presence in India..."
        )
        assert result.passed is True

    def test_archetype_india_market(self, validator):
        """India AI market trends should pass."""
        result = validator.validate(
            "India's GenAI market to reach $17B by 2030",
            "According to the report, India's AI sector is growing..."
        )
        assert result.passed is True

    def test_archetype_institution_research(self, validator):
        """Indian institution research should pass."""
        result = validator.validate(
            "IIT Madras researchers develop new NLP model",
            "The research team at Indian Institute of Technology..."
        )
        assert result.passed is True

    def test_archetype_event_in_india(self, validator):
        """AI event in India should pass."""
        result = validator.validate(
            "India AI Summit 2026 at Bangalore",
            "The conference will be held at Bangalore International..."
        )
        assert result.passed is True

    def test_archetype_indian_talent(self, validator):
        """Indian talent/hiring should pass."""
        result = validator.validate(
            "TCS to hire 10,000 AI engineers",
            "The company plans to expand its AI workforce in India..."
        )
        assert result.passed is True

    def test_archetype_foreign_india_ops(self, validator):
        """Foreign company India operations should pass."""
        result = validator.validate(
            "Google expands AI team in Bangalore",
            "Google India is hiring more ML engineers..."
        )
        assert result.passed is True


class TestContentIndiaSubstance:
    """Content with strong India substance should pass."""

    def test_multiple_india_signals(self, validator):
        """Multiple India signals in content should pass."""
        result = validator.validate(
            "Tech company announces expansion",
            "The company is expanding in India with new offices in Bangalore and Hyderabad. "
            "Indian engineers will lead the AI team. The move is part of their India strategy."
        )
        assert result.passed is True
        assert result.reason == 'CONTENT_INDIA_SUBSTANCE'

    @pytest.mark.parametrize('decision', [True, False])
    def test_rupee_amount(self, validator, monkeypatch, decision):
        """Currency alone needs review, not automatic India qualification."""
        monkeypatch.setattr(validator, '_llm_verify', lambda *args: {
            'is_india': decision, 'classification': 'TEST_REVIEW'})
        result = validator.validate(
            "Company raises funding round",
            "The startup raised Rs 500 crore in a funding round. "
            "Investors from India participated in the deal."
        )
        assert result.passed is decision
        assert result.reason == 'LLM_VERIFIED:TEST_REVIEW'
        assert result.llm_used is True


class TestNoIndiaSignal:
    """Articles without India signals should be dropped."""

    def test_generic_ai_news(self, validator):
        """Generic AI news without India should be dropped."""
        result = validator.validate(
            "New AI model achieves breakthrough",
            "Researchers developed a new machine learning model."
        )
        assert result.passed is False
        assert result.reason == 'NO_INDIA_SIGNAL'

    def test_generic_tech_news(self, validator):
        """Generic tech news should be dropped."""
        result = validator.validate(
            "Cloud computing trends for 2026",
            "The industry is seeing rapid growth in cloud adoption."
        )
        assert result.passed is False


class TestEdgeCases:
    """Edge cases and boundary conditions."""

    def test_empty_title(self, validator):
        """Empty title should work."""
        result = validator.validate("", "")
        assert result.passed is False
        assert result.reason == 'NO_INDIA_SIGNAL'

    def test_none_content(self, validator):
        """None content should work."""
        result = validator.validate("TCS launches AI tool", None)
        assert result.passed is True

    def test_case_insensitivity(self, validator):
        """Should work regardless of case."""
        result = validator.validate("INDIA'S AI MARKET GROWS")
        assert result.passed is True

    @pytest.mark.parametrize('decision', [True, False])
    def test_global_with_india_mention(self, validator, monkeypatch, decision):
        """An incidental country mention is decided by the review gate."""
        monkeypatch.setattr(validator, '_llm_verify', lambda *args: {
            'is_india': decision, 'classification': 'TEST_REVIEW'})
        result = validator.validate(
            "Global AI adoption report",
            "India ranks third globally in AI adoption. "
            "The Indian market showed strong growth..."
        )
        assert result.passed is decision
        assert result.reason == 'LLM_VERIFIED:TEST_REVIEW'
        assert result.llm_used is True


class TestValidationResult:
    """Test IndiaValidationResult dataclass."""

    def test_result_attributes(self, validator):
        """Result should have all expected attributes."""
        result = validator.validate("TCS launches AI")
        assert hasattr(result, 'passed')
        assert hasattr(result, 'reason')
        assert hasattr(result, 'india_score')
        assert hasattr(result, 'matched_patterns')
        assert hasattr(result, 'confidence')
        assert hasattr(result, 'llm_used')


class TestFilterArticleCompatibility:
    """Test filter_article method for orchestrator compatibility."""

    def test_filter_article_returns_dict(self, validator):
        """filter_article should return dict with expected keys."""
        article = {
            'title': 'TCS launches AI platform',
            'content': 'Tata Consultancy Services unveiled...'
        }
        result = validator.filter_article(article)
        assert isinstance(result, dict)
        assert 'passed' in result
        assert 'india_score' in result
        assert 'confidence' in result
        assert 'breakdown' in result

    def test_filter_article_with_india(self, validator):
        """filter_article should pass India articles."""
        article = {
            'title': 'Infosys expands AI capabilities',
            'content': 'The Indian IT giant...'
        }
        result = validator.filter_article(article)
        assert result['passed'] is True

    def test_filter_article_without_india(self, validator):
        """filter_article should drop non-India articles."""
        article = {
            'title': 'OpenAI releases new model',
            'content': 'The AI company announced...'
        }
        result = validator.filter_article(article)
        assert result['passed'] is False


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
